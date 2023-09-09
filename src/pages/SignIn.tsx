import React, { useEffect, useState, useRef, useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import jwt_decode from "jwt-decode";
import $ from "jquery";
import { mainContext } from "../Context/MainContext";
import { Input, message } from "antd";
import pencil from "../images/pencil.png";
import useNotification from "antd/es/notification/useNotification";
import dog1 from "../images/dog1.jpg";
import dog2 from "../images/dog2.jpg";
import cat1 from "../images/cat1.jpg";
function SignIn() {
  const { authData, setAuthData, googleFetch } = useContext(mainContext);
  const location = useLocation();
  const [username, setUserName] = useState("");
  const [winWidth, setWinWidth] = useState(window.innerWidth);
  const [errMess, setErrMess] = useState("");
  const [showPhotoSection, setShowPhotoSection] = useState(false);
  const [api, notifContext] = useNotification();
  const navigate = useNavigate();
  useEffect(() => {
    window.addEventListener("resize", () => {
      setWinWidth(window.innerWidth);
    });
  }, []);
  useEffect(() => {
    if (
      location.pathname == "/Auth" &&
      window.google != undefined &&
      googleFetch == true
    ) {
      const googleBtn = document.getElementById("googleRenderedBtn");
      if (window.innerWidth > 300) {
        window.google.accounts.id.renderButton(googleBtn, {
          theme: "filled_black",
          size: "large",
          shape: "pill",
        });
      } else {
        window.google.accounts.id.renderButton(googleBtn, {
          theme: "filled_black",
          size: "medium",
          shape: "pill",
        });
      }
    }
    if (
      location.pathname == "/Auth" &&
      authData != undefined &&
      authData.loggedIn == true
    ) {
      setTimeout(() => {
        alert("Already Logged In !!");
        navigate("/");
      }, 500);
    }
  }, [location]);
  function signInFunc() {
    debugger;
    // let resData: any;
    // if (
    //   localStorage.getItem("UserToken") !== null &&
    //   typeof localStorage.getItem("UserToken") == "string"
    // ) {
    //   let key = localStorage.getItem("UserToken");
    //   resData = jwt_decode(key as string);
    // }

    $.ajax({
      url: "/login",
      method: "POST",
      dataType: "json",
      contentType: "application/json",
      data: JSON.stringify({
        username: username,
        image: authData.image,
        firstName: authData.userData.given_name,
        lastName: authData.userData.family_name,
        email: authData.userData.email,
      }),
      success: (data) => {
        debugger;

        setAuthData({
          username: username,
          loggedIn: true,
          email: authData.userData.email,
          firstName: authData.userData.given_name,
          lastName: authData.userData.family_name,
          image: data.image,
          id: data.id,
          following: data.following,
          followers: data.followers,
          postCount: data.postCount,
        });
        localStorage.setItem("UserTokenId", data.id);
        navigate("/");
      },
      error: (err) => {
        // use a toast to show error
      },
    });
  }
  return (
    <div className="w-full h-[100vh] bg-neutral-800 text-white relative">
      {notifContext}
      <div className="absolute w-full  top-1/4">
        <div className="relative w-full flex flex-col items-center transition-all ">
          <div className="mx-auto flex flex-row gap-10 w-8/12 lg:w-5/12 items-center">
            <div className="w-5/12">
              <div className="grid grid-cols-2 gap-3">
                <img src={cat1} className="col-span-2 rounded-md " />
                <img src={dog1} className="rounded-md " />
                <img src={dog2} className="rounded-md" />
              </div>
            </div>
            <div className="mx-auto h-20 border-neutral-600 border-r">
              &nbsp;
            </div>
            <div className="ml-auto flex flex-col items-center border border-neutral-500 rounded-lg  w-fit  p-10 shadow-t-lg shadow-neutral-600 gap-5 transition-all relative h-fit">
              {(authData == undefined || authData.loggedIn == false) && (
                <>
                  <motion.div
                    transition={{
                      delay: 0.5,
                      duration: 1,
                      type: "spring",
                    }}
                    initial={{
                      opacity: 0,
                      translateY: 5,
                    }}
                    animate={{
                      opacity: 1,
                      translateY: 0,
                    }}
                    className="font-normal text-2xl "
                  >
                    Hello !
                  </motion.div>
                  <motion.hr
                    transition={{
                      delay: 0.5,
                      duration: 0.6,
                      type: "spring",
                    }}
                    initial={{
                      opacity: 0,
                      scale: 0,
                    }}
                    animate={{
                      opacity: 1,
                      scale: 1,
                    }}
                    className="w-full border-neutral-500"
                  />
                  <div className="flex flex-col gap-2">
                    <div
                      id="googleRenderedBtn"
                      className="w-fit  mx-auto"
                    ></div>
                  </div>
                </>
              )}
              {authData != undefined &&
                authData.loggedIn == true &&
                authData.newUser == true &&
                showPhotoSection === false && (
                  <div className="flex flex-col w-full gap-3 items-center">
                    <motion.div
                      transition={{
                        delay: 0.5,
                        duration: 1,
                        type: "spring",
                      }}
                      initial={{
                        opacity: 0,
                        translateY: 5,
                      }}
                      animate={{
                        opacity: 1,
                        translateY: 0,
                      }}
                      className="font-normal text-xl px-2 text-neutral-300"
                    >
                      Suggest a Username
                    </motion.div>
                    <motion.hr
                      transition={{
                        delay: 0.5,
                        duration: 0.6,
                        type: "spring",
                      }}
                      initial={{
                        opacity: 0,
                        scale: 0,
                      }}
                      animate={{
                        opacity: 1,
                        scale: 1,
                      }}
                      className="w-full border-neutral-500 "
                    />
                    <Input
                      placeholder="Enter Username"
                      value={username}
                      onChange={(e) => {
                        setErrMess("");
                        let name = e.target.value;
                        let str = "";
                        Array.from(name).forEach((item) => {
                          if (item != " ") {
                            str += item;
                          }
                        });
                        setUserName(str);
                      }}
                      className="text-center p-2"
                    />
                    {errMess.length != 0 && (
                      <div className="text-red-400">* {errMess}</div>
                    )}
                    {username.length != 0 && (
                      <motion.button
                        className="self-end border border-neutral-400 rounded-md p-1 px-2
                        hover:bg-neutral-400 hover:text-black transition-all  "
                        transition={{
                          delay: 0.1,
                          duration: 1,
                          type: "spring",
                          stiffness: 150,
                        }}
                        initial={{
                          opacity: 0,
                        }}
                        animate={{
                          opacity: 1,
                        }}
                        onClick={() => {
                          if (username.length != 0) {
                            debugger;
                            $.ajax({
                              url: "/CheckUser",
                              method: "GET",
                              headers: {
                                user: username,
                              },
                              success: (data: any) => {
                                setShowPhotoSection(true);
                              },
                              error: (err: any) => {
                                setErrMess(err.responseJSON.message);
                              },
                            });
                          }
                        }}
                      >
                        Save
                      </motion.button>
                    )}
                  </div>
                )}
              {showPhotoSection === true && (
                <>
                  <motion.div
                    transition={{
                      delay: 0.5,
                      duration: 1,
                      type: "spring",
                    }}
                    initial={{
                      opacity: 0,
                      translateY: 5,
                    }}
                    animate={{
                      opacity: 1,
                      translateY: 0,
                    }}
                    className="font-normal text-xl px-2 text-neutral-300 relative"
                  >
                    <div className="relative">
                      <img
                        src={authData.image}
                        alt="profile photo"
                        className="rounded-full w-36 h-36 text-center"
                      />
                      <div
                        className="absolute bottom-1 right-3"
                        onClick={() => {
                          document.getElementById("photoSelect")?.click();
                        }}
                      >
                        <img
                          src={pencil}
                          className="w-7 bg-neutral-700 rounded-full p-1 hover:bg-neutral-400 transition-all duration-100 ease-in-out"
                        />
                        <input
                          type="file"
                          className="hidden"
                          id="photoSelect"
                          onChange={(event) => {
                            let reader = new FileReader();
                            let file: any = event.target.files
                              ? event.target.files[0]
                              : "";
                            reader.readAsDataURL(file);
                            reader.addEventListener("load", (readerEvent) => {
                              debugger;
                              let data: any = readerEvent.target?.result;
                              if (data.includes("data:image") == true) {
                                let tempData = { ...authData };
                                tempData.image = data;
                                setAuthData({ ...tempData });
                              } else {
                                api.error({
                                  message: "Only Image format is supported",
                                });
                              }
                            });
                          }}
                        />
                      </div>
                    </div>
                  </motion.div>
                  <motion.button
                    className=" border border-neutral-400 rounded-md p-1 px-6
                        hover:bg-neutral-400 hover:text-black transition-all  "
                    transition={{
                      delay: 0.1,
                      duration: 1,
                      type: "spring",
                      stiffness: 150,
                    }}
                    initial={{
                      opacity: 0,
                    }}
                    animate={{
                      opacity: 1,
                    }}
                    onClick={() => {
                      if (authData.image != undefined) {
                        signInFunc();
                      } else {
                        api.error({
                          message: "Please reselect the profile picture.",
                        });
                      }
                    }}
                  >
                    Save
                  </motion.button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SignIn;
