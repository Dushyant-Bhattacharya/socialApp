/* global google */
/* global gapi */
import React, { Suspense, lazy, useContext, useEffect, useState } from "react";
import logo from "./logo.svg";
import "./App.css";
import {
  Link,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { ConfigProvider, Modal, theme } from "antd";
import Navbar from "./components/Navbar";
import jwt_decode from "jwt-decode";
import $ from "jquery";
import {
  authDataType,
  mainContext,
  modalType,
  newPostType,
  notifType,
  postTypes,
} from "./Context/MainContext";
import useNotification from "antd/es/notification/useNotification";
import useFetchPosts from "./customHooks/useFetchPosts";
import NewPosts from "./components/Popups/NewPosts";
import Notifications from "./components/Popups/Notifications";

declare global {
  interface Window {
    google: any;
  }
}
type signInResponseType = {
  clientId: string;
  client_id: string;
  credential: string;
  select_by: string;
};
const clientId = process.env.REACT_APP_CLIENTID;
const Home = lazy(() => {
  return import("./pages/Home");
});
const SignIn = lazy(() => {
  return import("./pages/SignIn");
});
const Profile = lazy(() => {
  return import("./pages/Profile");
});
function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const { fetchPostsCall } = useFetchPosts();
  const [api, contextHolder] = useNotification();

  const {
    setAuthData,
    authData,
    modalState,
    setModalState,
    viewedPosts,
    data,
    setData,
    loadStatus,
    setLoadStatus,
    postModal,
    setPostModal,
    notifModal,
    setNotifModal,
    googleFetch,
    setGoogleFetch
  }: {
    setAuthData: React.Dispatch<React.SetStateAction<authDataType | undefined>>;
    authData: authDataType;
    modalState: modalType;
    setModalState: React.Dispatch<React.SetStateAction<modalType>>;
    viewedPosts: React.MutableRefObject<[] | String[]>;
    data: undefined | postTypes[] | [];
    setData: any;
    loadStatus: "Complete" | "Loading" | undefined;
    setLoadStatus: React.Dispatch<
      React.SetStateAction<"Complete" | "Loading" | undefined>
    >;
    postModal: newPostType;
    setPostModal: React.Dispatch<React.SetStateAction<newPostType>>;
    notifModal: notifType;
    setNotifModal: React.Dispatch<React.SetStateAction<notifType>>;
    googleFetch:boolean;
    setGoogleFetch:React.Dispatch<React.SetStateAction<boolean>>
  } = useContext(mainContext);

  function googleSignIn() {
    let script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    document.head.append(script);

    script.addEventListener("load", (obj) => {
      debugger;
      
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response: signInResponseType) => {
          debugger;

          $.ajax({
            url: "/GenerateCustomToken",
            method: "GET",
            headers: {
              authorization: `Bearer ${response.credential}`,
            },
            success: (data: any) => {
              debugger;
              localStorage.setItem("UserToken", JSON.stringify(data.token));
              let responseData: any = jwt_decode(data.token);
              if (data.newUser == true) {
                // @ts-ignore
                setAuthData({
                  newUser: data.newUser,
                  loggedIn: true,
                  image: responseData.image,
                  userData: responseData,
                });
              } else {
                localStorage.setItem("UserTokenId", responseData.id);
                setAuthData({
                  newUser: data.newUser,
                  loggedIn: true,
                  ...responseData,
                  following: data.following,
                  followers: data.followers,
                  postCount: data.postCount,
                });
                navigate("/");
              }
            },
            error: (err) => {
              debugger;
            },
          });
        },
      });

      // window.google.accounts.id.prompt((notification: any) => {
      //   debugger;
      //   console.log(notification);
      // });
    });

    script.addEventListener("error", (err) => {
      debugger;
      // console.log(err.responseJSON);
      // we can show a popoup for closing the ad blocker right now.
    });
  }
  useEffect(() => {
    debugger;
    if (localStorage.getItem("UserToken") == null && authData == undefined) {
      googleSignIn();
      setTimeout(() => {
        navigate("/Auth");
      }, 100);
    } else {
      debugger;
      let data = localStorage.getItem("UserToken");
      if (data === null) {
        localStorage.removeItem("UserToken");
        googleSignIn();
        navigate("/Auth");
        return;
      }
      $.ajax({
        url: "/Googlejwtverify",
        method: "POST",
        dataType: "json",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${JSON.parse(data)}`,
          userid: localStorage.getItem("UserTokenId"),
        },

        success: (response) => {
          if (data != null) {
            let resData: any = jwt_decode(JSON.parse(data));

            setAuthData({
              username: resData.username,
              loggedIn: true,
              image: response.image,
              email: resData.email,
              firstName: resData.given_name,
              lastName: resData.family_name,
              id: localStorage.getItem("UserTokenId") as string,
              following: response.following,
              followers: response.followers,
              postCount: response.postCount,
            });
          }
        },
        error: (err, response) => {
          debugger;
          localStorage.removeItem("UserToken");
          localStorage.removeItem("UserTokenId");
          googleSignIn();
          navigate("/Auth");
        },
      });
    }
  }, []);
  function fetchUsers(
    getPosts?: boolean,
    following?: string[],
    forceReload?: boolean
  ) {
    $.ajax({
      url: "/Users",
      method: "GET",
      headers: {
        id: authData.id,
      },
      success: (data) => {
        let tempModalState = { ...modalState } as modalType;
        tempModalState.user = data.items;
        setModalState({ ...tempModalState });
        if (getPosts != undefined && getPosts == true) {
          fetchPostsCall(0, 5, following, forceReload);
          let tempAuth: authDataType = { ...authData };
          tempAuth.following = following;
          setAuthData(tempAuth);
        }
      },
      error: (err) => {
        // error
      },
    });
  }
  useEffect(() => {
    if (
      modalState.visible == true &&
      authData != undefined &&
      modalState.user == undefined
    ) {
      fetchUsers();
    }
  }, [modalState]);
  const { defaultAlgorithm, darkAlgorithm } = theme;
  return (
    <div className="App w-full min-h-[100vh] relative flex flex-row">
      <ConfigProvider
        theme={{
          algorithm: darkAlgorithm,
          components: {
            Input: {
              colorPrimary: "white",
              colorPrimaryHover: "white",
            },
            Mentions: {
              colorPrimary: "white",
              colorPrimaryHover: "white",
            },
          },
        }}
      >
        {contextHolder}
        <Modal
          footer={[]}
          open={notifModal != undefined && notifModal.visible == true}
        >
          <Notifications />
        </Modal>
        <Modal
          open={postModal?.visible}
          onCancel={() => {
            if (postModal != undefined) {
              let tempModalState = { ...postModal };
              tempModalState.visible = false;
              setPostModal({ ...tempModalState });
            }
          }}
          className="min-w-[80%] lg:min-w-[50%]"
          footer={[]}
        >
          <NewPosts />
        </Modal>

        <Modal
          open={modalState.visible}
          className="styledScrollbar"
          footer={[]}
          onCancel={() => {
            let tempModalState = { ...modalState } as modalType;
            tempModalState.visible = false;
            setModalState({ ...tempModalState });
          }}
        >
          {modalState.user != undefined && modalState.user.length > 0 && (
            <div className="relative w-full">
              <h3 className="font-bold text-2xl py-2 text-neutral-200">
                Users
              </h3>
              <div className="flex flex-col w-full p-3  mt-5 gap-2 max-h-[20rem] overflow-auto styledScrollbar">
                {modalState.user.map((user: any) => (
                  <div className="flex flex-row w-full items-center gap-3 px-2">
                    <img src={user.image} className="w-14 h-14 rounded-full" />
                    <Link
                      to={`/Profile?${user._id}`}
                      className="hover:underline hover:underline-offset-1 hover:decoration-neutral-300
                    "
                      onClick={() => {
                        let tempModalState = { ...modalState };
                        tempModalState.visible = false;

                        setModalState({ ...tempModalState });
                      }}
                    >
                      <h3 className="inline font-semibold text-neutral-100">
                        {user.username}
                      </h3>
                    </Link>
                    <button
                      className={`ml-auto border rounded-lg border-neutral-400 p-1 px-2 hover:bg-neutral-100 hover:text-black transition-all duration-150 ease-in-out hover:border-neutral-100 font-semibold 
                    `}
                      onClick={() => {
                        debugger;
                        // if (
                        //   ["DemoUser1", "DemoUser2"].includes(user.username) ==
                        //   false
                        // ) {
                        //   api.error({
                        //     message: (
                        //       <div className="flex flex-col w-full text-white gap-3">
                        //         <div>
                        //           Follow feature is only for{" "}
                        //           <h3 className="text-blue-500 inline">
                        //             DemoUser1
                        //           </h3>{" "}
                        //           &{" "}
                        //           <h3 className="text-blue-500 inline">
                        //             DemoUser2
                        //           </h3>{" "}
                        //           due to limited storage in Database.
                        //         </div>
                        //       </div>
                        //     ),
                        //   });
                        // } else {
                        let operation: boolean | undefined = undefined;
                        if (user.followers.includes(authData.id) == true) {
                          operation = false;
                        } else {
                          operation = true;
                        }
                        $.ajax({
                          url: "/Follow",
                          method: "POST",
                          contentType: "application/json",
                          dataType: "json",
                          data: JSON.stringify({
                            id: authData.id,
                            operation: operation,
                            targetUser: user._id,
                          }),
                          success: (respdata) => {
                            let res = respdata;
                            let tempAuth = { ...authData };
                            tempAuth.following = res.currentUserFollowing;
                            setAuthData({ ...tempAuth });
                            if (operation == false) {
                              viewedPosts.current = [];
                              fetchUsers(true, res.currentUserFollowing, true);
                            } else {
                              fetchUsers(true, res.currentUserFollowing, false);
                            }
                          },
                          error: (err) => {
                            api.error({
                              message: err.responseJSON.message,
                            });
                          },
                        });
                        // }
                      }}
                    >
                      {user.followers.includes(authData.id) == true
                        ? "Following"
                        : "Follow"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          {(modalState.user == undefined || modalState.user.length == 0) && (
            <div>No Data !!</div>
          )}
        </Modal>
        <div className="fixed left-0  h-full">
          {location.pathname != "/Auth" && <Navbar />}
        </div>

        <div className="w-full bg-neutral-900">
          <Routes>
            <Route
              path="/"
              element={
                <Suspense>
                  <Home />
                </Suspense>
              }
            ></Route>
            <Route
              path="/Auth"
              element={
                <Suspense>
                  <SignIn />
                </Suspense>
              }
            ></Route>
            <Route
              path="/Profile"
              element={
                <Suspense>
                  <Profile />
                </Suspense>
              }
            ></Route>
          </Routes>
        </div>
      </ConfigProvider>
    </div>
  );
}

export default App;
