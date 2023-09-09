const { connectToDb, getDb } = require("./db");
const express = require("express");
const app = express();
const dotenv = require("dotenv").config();
const bodyParser = require("body-parser");
const { OAuth2Client } = require("google-auth-library");
const jwt = require("jsonwebtoken");
const path = require("path");
const { ObjectId } = require("mongodb");
const port = process.env.PORT || 9000;
let db = undefined;
let dbName = "SocialApp";
const dbConnectString = `mongodb+srv://${process.env.MONGOUSER}:${process.env.MONGOPASS}@cluster0.uaqcb6e.mongodb.net/?retryWrites=true&w=majority`;
console.log(
  process.env.MONGOUSER,
  process.env.MONGOPASS,
  process.env.REACT_APP_CLIENTID
);
connectToDb(dbConnectString, dbName, (err) => {
  if (!err) {
    console.log("connection established");
    db = getDb();
  } else {
    console.log("Connnetion Failed");
  }
});
// Middlewares START
app.use(bodyParser.json({ limit: "16mb" }));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "./build")));
// Middlewares END

app.listen(port, (err) => {
  console.log("Server running on port" + port);
});
// app.get("/abc",(req,res)=>{
//   res.status(200).json({
//     data:"abc"
//   })
// })

app.get("/GenerateCustomToken", async (req, res) => {
  debugger;
  const client = new OAuth2Client(process.env.REACT_APP_CLIENTID);
  let token = req.headers.authorization.split(" ")[1];
  try {
    if (token.length > 1000) {
      //google token
      const ticket = await client.verifyIdToken({
        idToken: token,
        audience: process.env.REACT_APP_CLIENTID,
      });
      const payload = ticket.getPayload();
      const jwtPayload = {
        image: payload.picture,
        given_name: payload.given_name,
        family_name: payload.family_name,
        email: payload.email,
      };
      let user = await db.collection("Users").findOne({
        email: jwtPayload.email,
      });
      if (user != null) {
        jwtPayload.image = user.image;
        jwtPayload.username = user.username;
        jwtPayload.id = user._id;
      }
      const jwtToken = jwt.sign(
        {
          ...jwtPayload,
        },
        process.env.SECRETKEY,
        {
          expiresIn: "7d",
        }
      );

      if (user == null) {
        res.status(200).json({
          token: jwtToken,
          newUser: true,
        });
      } else {
        res.status(200).json({
          token: jwtToken,
          newUser: false,
          id: user._id,
          following: user.following,
          followers: user.followers,
          postCount: user.postCount,
        });
      }
    } else {
      throw "Invalid Token";
    }
  } catch (err) {
    res.status(500).json({
      error: err,
    });
  }
});
app.post("/Googlejwtverify", (req, res) => {
  debugger;
  // const client = new OAuth2Client(process.env.CLIENTID);
  const auth = async (req, res) => {
    debugger;
    let token = req.headers.authorization.split(" ")[1];
    let verified = undefined;
    jwt.verify(token, process.env.SECRETKEY, (err, decoded) => {
      if (err != null) {
        verified = false;
      } else {
        verified = true;
      }
    });
    if (verified == true) {
      let userid = req.headers.userid;
      db.collection("Users")
        .findOne({ _id: new ObjectId(userid) })
        .then((data) => {
          let obj = {
            image: data.image,
            following: data.following,
            followers: data.followers,
            postCount: data.postCount,
          };
          obj.valid = true;

          res.status(200).json(obj);
        })
        .catch((err) => {
          res.status(200).json({
            valid: true,
          });
        });
      // res.status(200).json({ valid: true });
    } else {
      // custom token
      let a = 1213;
    }
  };
  auth(req, res).catch((err) => {
    res.status(500).json({ valid: false });
  });
});
app.post("/login", (req, res) => {
  let userData = req.body;
  let signupImage = req.body.image;
  db.collection("Users")
    .findOne({ username: userData.username })
    .then((data) => {
      debugger;
      if (data != null) {
        // logging in user
        let response = data;
        // let match = bcrypt.compareSync(userData.password, response.password);
        // console.log(data);
        // if (match == true) {
        // let token = createToken(response._id);
        let obj = {
          message: "success",
          id: data._id,
          image: data.image,

          // login: true,
          // token: token,
        };

        res.status(200).json(obj);
        // }
      } else {
        // signing up user
        userData.following = [];
        userData.followers = [];
        userData.postCount = 0;
        userData.notifications = [];
        db.collection("Users")
          .insertOne(userData)
          .then((insertData) => {
            console.log(insertData);

            res.status(200).json({
              message: "success",
              id: insertData.insertedId,
              followers: [],
              postCount: 0,
              following: [],
              image: signupImage,
            });
          })
          .catch((err) => {
            console.log(err);
            res.status(500).json({ message: "fail" });
          });
      }
    });
});

app.get("/CheckUser", (req, res) => {
  let user = req.headers.user;
  db.collection("Users")
    .findOne({ username: user })
    .then((data) => {
      if (data == null) {
        res.status(200).json({
          available: true,
        });
      } else {
        res.status(500).json({
          available: false,
          message: "Usename Already In Use",
        });
      }
    });
});

app.get("/GetPosts", (req, res) => {
  let viewedPosts = req.headers.viewed_post;
  if (viewedPosts != undefined && viewedPosts.length > 0) {
    viewedPosts = viewedPosts.split(",").map((item) => {
      return new ObjectId(item);
    });
  } else {
    viewedPosts = [];
  }
  let skip = Number(req.headers.skip);
  let limit = Number(req.headers.limit);
  let following = req.headers.following.split(",");
  if (req.headers.following.length > 0) {
    following = following.map((item) => {
      return new ObjectId(item);
    });
  } else {
    following = [];
  }
  let result = [];
  db.collection("Posts")
    .aggregate([
      {
        $match: {
          $and: [
            { userid: { $in: following } },
            { _id: { $nin: viewedPosts } },
          ],
        },
      },
      {
        $skip: skip,
      },
      {
        $limit: limit,
      },
      {
        $lookup: {
          from: "Users",
          localField: "userid",
          foreignField: "_id",
          as: "userData",
        },
      },
      {
        $unwind: {
          path: "$userData",
        },
      },
      {
        $addFields: {
          convertedDate: { $toDate: "$order_date" },
        },
      },
      {
        $sort: { convertedDate: -1 },
      },
    ])
    .forEach((item) => {
      result.push(item);
    })
    .then(() => {
      res.status(200).json({
        items: result,
        count: result.length,
        hasMore: result.length == limit,
      });
    })
    .catch((err) => {
      res.status(200).json({
        items: [],
        message: "Error fetching new posts , please try again",
      });
    });
});

app.post("/EditLike", (req, res) => {
  let operation = req.body.operation;
  let id = req.body.id;
  let postId = req.body.postId;
  db.collection("Posts")
    .findOne({
      _id: new ObjectId(postId),
    })
    .then((data) => {
      let likedByArray = data.likedBy;
      let likes = data.likes;
      if (operation == true) {
        likedByArray.push(id);
        likes += 1;
      } else {
        let index = likedByArray.findIndex((item) => {
          return item == id;
        });
        likedByArray.splice(index, 1);
        likes -= 1;
      }
      likedByArray.forEach((item, index) => {
        likedByArray[index] = new ObjectId(item);
      });

      db.collection("Posts")
        .updateOne(
          {
            _id: new ObjectId(postId),
          },
          {
            $set: {
              likedBy: likedByArray,
              likes: likes,
            },
          }
        )
        .then((updatedReponse) => {
          res.status(200).json({
            message: "Operation Successfull",
          });
        })
        .catch((err) => {
          res.status(500).json({
            message: "Error processing new operation",
          });
        });
    })
    .catch((err) => {
      res.status(500).json({
        message: "Error processing new operation",
      });
    });
});

app.get("/LikedUsers", (req, res) => {
  let id = req.headers.id;
  let result = [];
  db.collection("Posts")
    .aggregate([
      {
        $match: { _id: new ObjectId(id) },
      },
      {
        $lookup: {
          from: "Users",
          localField: "likedBy",
          foreignField: "_id",
          as: "likedByUsers",
        },
      },
      {
        $unwind: {
          path: "$likedByUsers",
        },
      },
      {
        $unset: [
          "likedByUsers.email",
          "likedByUsers.followers",
          "likedByUsers.following",
          "likedByUsers.postCount",
          "items",
          "likes",
          "timestamp",
        ],
      },
      {
        $group: {
          _id: "$_id",
          items: {
            $push: "$$ROOT",
          },
        },
      },
    ])
    .forEach((item) => {
      result.push(item);
    })
    .then(() => {
      if (result.length > 0) {
        res.status(200).json(result[0]);
      } else {
        res.status(200).json({
          items: [],
        });
      }
    })
    .catch((err) => {
      res.status(500).json({
        message: "Error Fetching Users",
      });
    });
});

app.get("/FetchComments", (req, res) => {
  let postId = req.headers.post_id;
  let result = [];
  db.collection("Comments")
    .aggregate([
      {
        $match: {
          postId: new ObjectId(postId),
        },
      },
      {
        $addFields: {
          convertedDate: { $toDate: "$timestamp" },
        },
      },
      {
        $sort: { convertedDate: -1 },
      },
      {
        $lookup: {
          from: "Users",
          localField: "userid",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $unwind: {
          path: "$user",
        },
      },
      {
        $unset: [
          "user.email",
          "user.followers",
          "user.following",
          "user.postCount",
          "convertedDate",
        ],
      },
    ])
    .forEach((item) => {
      result.push(item);
    })
    .then(() => {
      res.status(200).json({
        items: result,
      });
    })
    .catch((err) => {
      res.status(200).json({
        items: [],
        message: "Error Fetching Comments",
      });
    });
});
app.post("/SaveComment", (req, res) => {
  let payload = req.body;
  payload.postId = new ObjectId(payload.postId);
  payload.userid = new ObjectId(payload.userid);
  payload.timestamp = JSON.stringify(new Date());
  payload.timestamp = payload.timestamp.substring(
    1,
    payload.timestamp.length - 1
  );
  db.collection("Comments")
    .insertOne(payload)
    .then((data) => {
      res.status(200).json({
        message: "Operation Successfull",
      });
    })
    .catch((err) => {
      res.status(500).json({
        message: "Errors saving the comment",
      });
    });
});

app.get("/Users", (req, res) => {
  let currentUser = req.headers.id;
  let result = [];
  db.collection("Users")
    .find({
      _id: { $nin: [new ObjectId(currentUser)] },
    })
    .forEach((item) => {
      result.push(item);
    })
    .then(() => {
      res.status(200).json({
        items: result,
      });
    })
    .catch((err) => {
      res.status(500).json({
        message: "Error Fetching Users",
      });
    });
});
app.post("/Follow", (req, res) => {
  let operation = req.body.operation;
  let userid = req.body.id;
  let targetUser = req.body.targetUser;
  db.collection("Users")
    .findOne({
      _id: new ObjectId(targetUser),
    })
    .then((data) => {
      let followers = data.followers;
      if (operation == true) {
        followers.push(userid);
      } else {
        let index = followers.findIndex((item) => {
          return item == userid;
        });
        followers.splice(index, 1);
      }
      followers.forEach((item, index) => {
        followers[index] = new ObjectId(item);
      });
      db.collection("Users")
        .updateOne(
          {
            _id: new ObjectId(targetUser),
          },
          {
            $set: {
              followers: followers,
            },
          }
        )
        .then(() => {
          db.collection("Users")
            .findOne({
              _id: new ObjectId(userid),
            })
            .then((currentUserData) => {
              let following = currentUserData.following;
              if (operation == true) {
                following.push(targetUser);
              } else {
                let index = following.findIndex((item) => {
                  return item == targetUser;
                });
                following.splice(index, 1);
              }
              following.forEach((item, index) => {
                following[index] = new ObjectId(item);
              });
              db.collection("Users")
                .updateOne(
                  {
                    _id: new ObjectId(userid),
                  },
                  {
                    $set: {
                      following: following,
                    },
                  }
                )
                .then(() => {
                  res.status(200).json({
                    currentUserFollowing: following,
                    message: "Operation Successfull",
                  });
                })
                .catch((err) => {
                  res.status(500).json({
                    message: "Error updating follow status",
                  });
                });
            })
            .catch((err) => {
              res.status(500).json({
                message: "Error updating follow status",
              });
            });
        })

        .catch((err) => {
          res.status(500).json({
            message: "Error updating follow status",
          });
        });
    })
    .catch((err) => {
      res.status(500).json({
        message: "Error updating follow status",
      });
    });
});
app.post("/IndividualUser", (req, res) => {
  let profileId = req.body.profile_id;
  let result = [];

  db.collection("Users")
    .aggregate([
      {
        $match: {
          _id: new ObjectId(profileId),
        },
      },
      {
        $lookup: {
          from: "Posts",
          localField: "_id",
          foreignField: "userid",
          as: "posts",
          pipeline: [
            {
              $addFields: {
                convertedDate: { $toDate: "$timestamp" },
              },
            },
            {
              $sort: { convertedDate: -1 },
            },
          ],
        },
      },
    ])
    .forEach((item) => {
      result.push(item);
    })
    .then((data) => {
      if (result.length > 0) {
        res.status(200).json({
          profileData: result[0],
        });
      } else {
        res.status(500).json({
          message: "Profile Does Not Exist",
        });
      }
    })
    .catch((err) => {
      res.status(500).json({
        message: "Error Fetching User Details",
      });
    });
});
app.post("/CreatePosts", (req, res) => {
  let username = req.headers.username;
  let payload = req.body;
  payload.userid = new ObjectId(payload.userid);
  payload.likes = 0;
  payload.likedBy = [];
  payload.timestamp = JSON.stringify(new Date());
  payload.timestamp = payload.timestamp.substring(
    1,
    payload.timestamp.length - 1
  );
  let a = payload.body.trim() + " ";
  let mentions = [];
  let str = "";
  let flag = false;
  Array.from(a).forEach((item) => {
    if (item == "@") {
      flag = true;
    } else if (item == " ") {
      flag = false;
      if (str.length != 0) {
        mentions.push(str);
        str = "";
      }
    } else {
      if (flag == true) {
        str += item;
      }
    }
  });
  db.collection("Posts")
    .insertOne(payload)
    .then((data) => {
      let postid = data.insertedId;
      let results = [];
      db.collection("Users")
        .find({
          username: { $in: mentions },
        })
        .forEach((item) => {
          results.push(item);
        })
        .then(async () => {
          for (let i = 0; i < results.length; i++) {
            let notif = results[i].notifications;
            notif.push({
              text: `${username} mentioned you in a post`,
              postId: new ObjectId(postid),
            });
            let update = await db
              .collection("Users")
              .updateOne(
                {
                  _id: new ObjectId(results[i]._id),
                },
                {
                  $set: {
                    notifications: notif,
                  },
                }
              )
              .catch((err) => {
                res.status(500).json({
                  message:
                    "Post created , but failed to generate notifications",
                });
                return;
              });
          }
          res.status(200).json({
            message: "Operation Successfull",
          });
        });
    })
    .catch((err) => {
      res.status(500).json({
        message: "Error Creating a Post",
      });
    });
});
app.get("/Notifications", (req, res) => {
  let userid = req.headers.userid;
  let result = [];
  db.collection("Users")
    .aggregate([
      {
        $match: {
          _id: new ObjectId(userid),
        },
      },
      {
        $unset: [
          "followers",
          "username",
          "image",
          "firstName",
          "lastName",
          "email",
          "following",
          "postCount",
        ],
      },
    ])
    .forEach((item) => {
      result.push(item);
    })
    .then(() => {
      res.status(200).json({
        items: result.length > 0 ? result[0].notifications : [],
      });
    })
    .catch((err) => {
      res.status(500).json({
        message: "Error Finding Notifications",
      });
    });
});
app.get("/*", (req, res) => {
  res.sendFile(path.resolve(__dirname, "build", "index.html"));
});
