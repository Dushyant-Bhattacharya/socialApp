import React, { useContext, useEffect, useState } from "react";
import $ from "jquery";
import { authDataType, mainContext, postTypes } from "../Context/MainContext";
import { useLocation } from "react-router-dom";
import { Carousel, Modal, Spin } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import useNotification from "antd/es/notification/useNotification";
type profileType =
  | {
      _id: string;
      username: string;
      image: string;
      firstName: string;
      lastName: string;
      email: string;
      followers: string[];
      following: string[];
      postCount: number;
      posts: postTypes[];
    }
  | undefined;
function Profile() {
  const {
    authData,
    viewedPosts,
    hasMorePosts,
    setAuthData,
    setData,
  }: {
    authData: authDataType;
    viewedPosts: React.MutableRefObject<[] | String[]>;
    hasMorePosts: React.MutableRefObject<boolean>;
    setAuthData: React.Dispatch<React.SetStateAction<authDataType | undefined>>;
    setData: React.Dispatch<React.SetStateAction<[] | postTypes[] | undefined>>;
  } = useContext(mainContext);
  const location = useLocation();
  const [profileData, setProfileData] = useState<profileType>(undefined);
  const [api, contextHolder] = useNotification();
  const [modalState, setModalState] = useState<{
    visible: boolean;
    message: string;
  }>({
    visible: false,
    message: "",
  });
  function fetchIndividualUser(profileId: string) {
    $.ajax({
      url: "/IndividualUser",
      method: "POST",
      data: JSON.stringify({
        profile_id: profileId,
      }),
      success: (data) => {
        debugger;
        setProfileData(data.profileData);
      },
      error: (err) => {
        debugger;
        if (err.responseJSON.message == "Profile Does Not Exist") {
        }
      },
    });
  }
  useEffect(() => {
    if (
      authData != undefined &&
      authData.loggedIn == true &&
      location.pathname == "/Profile"
    ) {
      let profileId = decodeURI(window.location.search.substring(1));
      fetchIndividualUser(profileId);
    }
  }, [authData, location]);

  return (
    <div>
      {contextHolder}
      <Modal open={modalState.visible}>
        <div>{modalState.message}</div>
      </Modal>
      {profileData == undefined && (
        <div className="flex flex-row w-full">
          <div className="mx-auto">
            <Spin
              indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />}
            />
          </div>
        </div>
      )}
      {profileData != undefined && (
        <div className="flex flex-col w-full p-2 mt-10 gap-4 text-neutral-200 font-bold text-lg">
          <div className="flex flex-row px-4 p-2 mx-auto gap-4  items-center  w-9/12 lg:w-5/12">
            <div className="flex flex-col items-center mx-auto gap-4">
              <img src={profileData.image} className="w-28 h-28 rounded-full" />
              <h3 className="text-xl font-semibold">{profileData.username}</h3>
            </div>

            <div className="mx-auto border-r border-neutral-600 h-[5rem]">
              &nbsp;
            </div>
            <div className="flex flex-col gap-5 ml-auto mr-10">
              <div className="flex flex-row  gap-12 ">
                <div className="flex flex-col items-center gap-2">
                  <h3>Posts</h3>
                  <h3>{profileData.postCount}</h3>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <h3>Following</h3>
                  <h3>{profileData.following.length}</h3>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <h3>Followers</h3>
                  <h3>{profileData.followers.length}</h3>
                </div>
              </div>
              {decodeURI(window.location.search.substring(1)) !=
                authData.id && (
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
                    if (profileData.followers.includes(authData.id) == true) {
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
                        targetUser: profileData._id,
                      }),
                      success: (respdata) => {
                        viewedPosts.current = [];
                        hasMorePosts.current = true;
                        let tempAuth = { ...authData };
                        tempAuth.following = respdata.currentUserFollowing;
                        setAuthData({ ...tempAuth });
                        let profileId = decodeURI(
                          window.location.search.substring(1)
                        );
                        setData([]);
                        fetchIndividualUser(profileId);
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
                  {profileData.followers.includes(authData.id) == true
                    ? "Following"
                    : "Follow"}
                </button>
              )}
            </div>
          </div>
          <hr className="border-neutral-500 mx-auto w-8/12 lg:w-5/12" />
          <div className=" mx-auto w-9/12 lg:w-5/12 p-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              {profileData.posts.map((post) => (
                <div className="flex flex-col w-full items-center ">
                  <div className="w-40 h-40 mx-auto rounded-md overflow-hidden">
                    <div className="w-full h-full">
                      <Carousel autoplay>
                        {post.items.map((image) => (
                          <div>
                            <img src={image} className="w-full h-full" />
                          </div>
                        ))}
                      </Carousel>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;
