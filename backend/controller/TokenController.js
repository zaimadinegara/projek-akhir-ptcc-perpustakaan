import User from "../model/User.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const ACCESS_TOKEN = process.env.ACCESS_TOKEN;
const REFRESH_TOKEN = process.env.REFRESH_TOKEN;

export const getAccessToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken){
        return res.status(401).json({ message: "Unauthorized, please login" });
    }

    const user = await User.findOne({
      where: {
        refresh_token: refreshToken,
      },
    });

    if (!user) return res.sendStatus(403);
    else
      jwt.verify(
        refreshToken,
        REFRESH_TOKEN,
        (err, decoded) => {
          if (err) return res.sendStatus(403);

          const userPlain = user.toJSON();
          const { password: _, refresh_token: __, ...safeUserData } = userPlain;
          const accessToken = jwt.sign(
            safeUserData,
            ACCESS_TOKEN,
            {
              expiresIn: "1d",
            }
          );
          res.json({ accessToken });
        }
      );
  } catch (error) {
    console.log(error);
  }
};