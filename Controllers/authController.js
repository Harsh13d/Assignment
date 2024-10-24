const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/usersModel");

const Register = (req, res) => {
  User.findOne({ email: req.body.email }).exec()
    .then((user) => {
      if (user) {
        return res.send({
          message: "User already exists",
          success: false,
          data: null,
        });
      }
      return bcrypt.hash(req.body.password, 6);
    })
    .then((hashedPassword) => {
      req.body.password = hashedPassword;
      const newUser = new User(req.body);
      return newUser.save();
    })
    .then(() => {
      
      res.send({
        message: "User created successfully",
        success: true,
        data: null,
      });
    })
    .catch((error) => {
      res.send({
        message: error.message,
        success: false,
        data: null,
      });
    });
};


const Login = async (req, res) => {
  try {
    const existingUser = await User.findOne({ email: req.body.email });
    if (!existingUser) {
      return res.status(400).send({
        message: "User does not exist",
        success: false,
        data: null,
      });
    }

    const isPasswordCorrect = await bcrypt.compare(
      req.body.password,
      existingUser.password
    );
    if (!isPasswordCorrect) {
      return res.status(400).send({
        message: "Incorrect password",
        success: false,
        data: null,
      });
    }

    const token = jwt.sign(
      { userId: existingUser._id, isAdmin: existingUser.isAdmin },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    // Cookie options: HttpOnly (can't be accessed by JavaScript), Secure (only over HTTPS in production)
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Set secure flag only in production
      sameSite: "strict", // Helps mitigate CSRF attacks
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    };

    // Set the cookie with the JWT
    res.cookie("authToken", token, cookieOptions);

    const user = {
      name: existingUser.name,
      email: existingUser.email,
      isAdmin: existingUser.isAdmin,
      _id: existingUser._id,
    };

    res.status(200).send({
      message: "User logged in successfully",
      success: true,
      user: user, // Send user details without the token
    });
  } catch (error) {
    res.status(500).send({
      message: error.message,
      success: false,
      data: null,
    });
  }
};


module.exports = { Register, Login };
