const { urlModel, userModel } = require("../model/urlSchema");
const validUrl = require("valid-url");
const uniqueString = require("../utils/utils");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");

dotenv.config();

const getSpecificUrl = async (req, res) => {
  try {
    //receives json data from client.
    const shortId = req.params.shortId;

    //get original url from unique key as it is mapped with original url in redis.
    const urlData = await urlModel.findOne({ shortId: shortId });
    const originalUrl = urlData.originalUrl;

    //if original url is present in redis then redirect it.
    if (originalUrl) {
      res.redirect(originalUrl);
    } else {
      res.status(404).send("URL not found");
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const createUrl = async (req, res) => {
  //receives json data from client
  const originalUrl = req.body.originalUrl;

  //validate the original url received from client
  if (validUrl.isUri(originalUrl)) {
    try {
      //check if url already shorted or not.
      const urlExist = await urlModel.findOne({ originalUrl: originalUrl });

      if (urlExist) {
        //If exist then simply return the shortId instead of creating new one
        const shortId = urlExist.shortId;
        res.status(201).json(`${process.env.REDIRECT_URL}/${shortId}`);
      } else {
        //generate 7 digit unique code using base-62 encoding
        const shortId = uniqueString.generateBase62String();
        //store data(shorturl, longurl)
        const newUrl = new urlModel({
          originalUrl: originalUrl,
          shortId: shortId,
        });

        await newUrl.save();

        //send shorturl to client
        res.status(201).json(`${process.env.REDIRECT_URL}/${shortId}`);
      }
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  }

  //if longurl is not a valid.
  else {
    res.status(400).json("Please Enter a Valid URL");
  }
};

const signup = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const user = await userModel.findOne({ email: email, password: password });
    if (user) res.send("User already exist");
    else {
      const user = new userModel({
        username,
        email,
        password,
      });
      await user.save();
      res.send("user registered successfully");
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
const login = async (req, res) => {
  try {
    const {email , password} = req.body;
    const userObj = {email , password};
   const user =  await userModel.findOne({email , password});
   if(user){
    const token =  jwt.sign(userObj , process.env.secret , {expiresIn:'1h'}); 
    res.json({
      mssg:'user logged successfully',
      token:token
    });
   }
   else {
    res.send('user not present');
   }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}
module.exports = {
  getSpecificUrl,
  createUrl,
  signup,
  login,
};
