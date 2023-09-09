import React, {
  useContext,
  useEffect,
  useState,
  useRef,
  ReactComponentElement,
  ReactNode,
} from "react";
import { motion } from "framer-motion";
import { authDataType, mainContext, postTypes } from "../Context/MainContext";
import { Carousel, Popover, Skeleton, Spin } from "antd";
import $ from "jquery";
import { LoadingOutlined } from "@ant-design/icons";
import useNotification from "antd/es/notification/useNotification";
import TextArea from "antd/es/input/TextArea";
import useFetchPosts from "../customHooks/useFetchPosts";
import { Link, useLocation } from "react-router-dom";

function Home() {
  const {
    authData,
    data,
    setData,
    loadStatus,
    setLoadStatus,
  }: {
    authData: authDataType;
    data: postTypes[];
    setData: React.Dispatch<React.SetStateAction<postTypes[] | [] | undefined>>;
    loadStatus: "Complete" | "Loading" | undefined;
    setLoadStatus: React.Dispatch<
      React.SetStateAction<"Complete" | "Loading" | undefined>
    >;
  } = useContext(mainContext);
  const [likeProcessing, setLikeProcessing] = useState<{
    processing: boolean;
    index: number;
  }>({
    processing: false,
    index: -1,
  });
  const [likedUserLoading, setLikedUserLoading] = useState<
    "Complete" | "Loading" | undefined
  >(undefined);
  const location = useLocation();
  const { fetchPosts } = useFetchPosts();
  // const [loadStatus, setLoadStatus] = useState<
  //   "Complete" | "Loading" | undefined
  // >(undefined);
  // const [data, setData] = useState<undefined | postTypes[] | []>(undefined);
  const [api, contextHolder] = useNotification();
  const [newComment, setNewComment] = useState<string>("");
  const [commentProcessing, setCommentProseccing] = useState<
    "Complete" | "Loading" | undefined
  >(undefined);

  useEffect(() => {
    if (
      authData != undefined &&
      authData.loggedIn == true &&
      location.pathname == "/"
    ) {
      fetchPosts();
    }
  }, [authData, location]);

  const skeletonItems = [{}, {}, {}, {}];
  function fetchComments(id: string, index: number, showLoad?: boolean) {
    if (showLoad == undefined || showLoad == true) {
      setCommentProseccing("Loading");
    }
    $.ajax({
      url: "/FetchComments",
      method: "GET",
      headers: {
        post_id: id,
      },
      success: (respdata) => {
        debugger;
        let tempData = structuredClone(data) as postTypes[];
        tempData[index].comments = respdata.items;
        setData([...tempData]);
        setCommentProseccing("Complete");
      },
      error: (err) => {
        debugger;
        let tempData = structuredClone(data) as postTypes[];
        tempData[index].comments = [];
        setData([...tempData]);
        setCommentProseccing("Complete");
        api.error({
          message: err.responseJSON.message,
        });
      },
    });
  }
  function saveComments(comment: string, id: string, index: number) {
    debugger;
    $.ajax({
      url: "/SaveComment",
      method: "POST",
      contentType: "application/json",
      dataType: "json",
      data: JSON.stringify({
        content: comment,
        postId: id,
        userid: authData.id,
      }),
      success: (data) => {
        setNewComment("");
        fetchComments(id, index, false);
      },
      error: (err: any) => {
        api.error({
          message: err.responseJSON.message,
        });
      },
    });
  }
  return (
    <div className="text-black w-full ">
      {contextHolder}
      <div className="flex flex-col w-8/12 lg:w-4/12 mx-auto items-center mt-5 gap-2 p-2 mb-5">
        {loadStatus == undefined &&
          skeletonItems.map(() => (
            <div className="flex flex-col items-center w-full overflow-hidden">
              <div className="flex flex-row bg-neutral-700 w-full gap-3 items-center">
                <Skeleton.Avatar size={"large"} active={true} className="p-2" />
                <Skeleton.Input size={"small"} active={true} className="" />
              </div>
              <div className="w-full h-[30rem] bg-neutral-800 animate-pulse">
                &nbsp;
              </div>
              <div className="flex flex-row bg-neutral-700 w-full gap-2 items-center">
                <Skeleton.Avatar size={"small"} active={true} className="p-2" />
                <Skeleton.Avatar size={"small"} active={true} className="" />
              </div>
              <div className="flex flex-col bg-neutral-700 w-full gap-3 p-2 items-start">
                <Skeleton.Input size={"small"} active={true} className="" />
              </div>
            </div>
          ))}
        {loadStatus == "Complete" &&
          data?.length != 0 &&
          data?.map((item: any, index: number) => (
            <div className="flex flex-col items-center w-full overflow-hidden rounded-md">
              <div className="flex flex-row bg-neutral-800 w-full gap-3 items-center">
                <img
                  src={item.userData.image}
                  className="w-16 h-16 p-2 rounded-full"
                />
                <Link to={`/Profile?${encodeURI(item.userData._id)}`}>
                  <h3 className="font-semibold text-neutral-300 hover:underline hover:underline-offset-1 hover:decoration-neutral-300">
                    {item.userData.username}
                  </h3>
                </Link>
              </div>
              <div className="w-full">
                <Carousel className=" " autoplay>
                  {item.items != undefined &&
                    item.items.map((post: any) => (
                      <div className="">
                        <img className="w-full h-[30rem]" src={post} />
                      </div>
                    ))}
                </Carousel>
              </div>
              <div className="flex flex-row bg-neutral-800 w-full gap-2 items-center px-2 p-1">
                {/* Like Button */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className={`w-7
                   text-neutral-300 hover:text-red-500 hover:fill-red-500 transition-all duration-150 ease-in-out hover:cursor-pointer
                   ${
                     item.likedBy.includes(authData.id) == true &&
                     "fill-red-500 text-red-500"
                   }
                   ${
                     likeProcessing.processing == true &&
                     likeProcessing.index == index &&
                     "opacity-50 pointer-events-none fill-red-500 text-red-500"
                   }`}
                  onClick={() => {
                    debugger;
                    let likedByArray: string[] = item.likedBy;
                    let like: undefined | boolean = undefined;
                    if (likedByArray.includes(authData.id) == true) {
                      like = false;
                    } else {
                      like = true;
                    }
                    let postIndex = index;
                    setLikeProcessing({
                      processing: true,
                      index: postIndex,
                    });
                    $.ajax({
                      url: "/EditLike",
                      method: "POST",
                      contentType: "application/json",
                      dataType: "json",
                      data: JSON.stringify({
                        operation: like,
                        id: authData.id,
                        postId: item._id,
                      }),
                      success: (respdata) => {
                        let tempData = structuredClone(data);
                        if (like == true) {
                          tempData[postIndex].likedBy.push(authData.id);
                          tempData[postIndex].likes += 1;
                        } else {
                          let userIndex = tempData[postIndex].likedBy.findIndex(
                            (user: any) => {
                              return user == authData.id;
                            }
                          );
                          tempData[postIndex].likedBy.splice(userIndex, 1);
                          tempData[postIndex].likes -= 1;
                        }
                        setData([...tempData]);
                        setLikeProcessing({
                          processing: false,
                          index: -1,
                        });
                      },
                      error: (err) => {
                        setLikeProcessing({
                          processing: false,
                          index: -1,
                        });
                        api.error({
                          message: err.responseJSON.message,
                        });
                      },
                    });
                  }}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
                  />
                </svg>
                {/* Comment Button */}
                <Popover
                  trigger={"click"}
                  placement="right"
                  content={
                    <div>
                      {commentProcessing == "Loading" && (
                        <Spin
                          indicator={
                            <LoadingOutlined style={{ fontSize: 24 }} spin />
                          }
                        />
                      )}
                      {commentProcessing == "Complete" &&
                        item.comments != undefined &&
                        item.comments.length == 0 && (
                          <div className="w-full flex flex-row h-[3rem]">
                            <div className="mx-auto font-semibold my-auto">
                              Be the first to comment !!
                            </div>
                          </div>
                        )}
                      {commentProcessing == "Complete" &&
                        item.comments != undefined &&
                        item.comments.length > 0 && (
                          <div className="flex flex-col w-[15rem] h-[15rem] overflow-auto styledScrollbar mb-3">
                            {item.comments != undefined &&
                              item.comments.map((item: any) => (
                                <div className="flex flex-row w-full">
                                  <img
                                    src={item.user.image}
                                    className="w-8 h-8 rounded-full"
                                  />
                                  <div className="flex flex-col items-start px-2 p-1">
                                    <Link
                                      to={`/Profile?${encodeURI(item.user._id)}
                                      `}
                                      className="
                                     hover:underline hover:underline-offset-1 hover:decoration-neutral-300"
                                    >
                                      <h3 className="inline font-semibold ">
                                        {item.user.username}
                                      </h3>
                                    </Link>
                                    <p className="font-light">{item.content}</p>
                                  </div>
                                </div>
                              ))}
                          </div>
                        )}
                      <div className="flex flex-row gap-2 items-center">
                        <TextArea
                          value={newComment}
                          onChange={(e) => {
                            setNewComment(e.target.value);
                          }}
                        />
                        <div className="mt-auto">
                          {newComment.length > 0 && (
                            <motion.button
                              transition={{
                                delay: 0.2,
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
                              onClick={() => {
                                saveComments(newComment, item._id, index);
                              }}
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1.5}
                                stroke="currentColor"
                                className="w-9 h-9 text-neutral-200 hover:bg-neutral-600 rounded-md p-1 transition-all duration-150 ease-in-out"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
                                />
                              </svg>
                            </motion.button>
                          )}
                        </div>
                      </div>
                    </div>
                  }
                  onOpenChange={(visible) => {
                    if (visible == true) {
                      fetchComments(item._id, index);
                    }
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-7 text-neutral-300 hover:text-black hover:fill-neutral-100 transition-all duration-150 ease-in-out hover:cursor-pointer"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
                    />
                  </svg>
                </Popover>
              </div>
              <h3 className="text-white inline w-full bg-neutral-800 px-4 p-1">{item.body}</h3>
              <div className="flex flex-col bg-neutral-800 w-full gap-1 p-2 px-4 items-start ">
                <Popover
                  trigger={"click"}
                  placement="right"
                  onOpenChange={(visible) => {
                    debugger;
                    if (visible == true) {
                      if (
                        item.likedByUsers == undefined ||
                        item.likes == 0 ||
                        item.likedByUsers.length == 0
                      ) {
                        let itemIndex = index;
                        setLikedUserLoading("Loading");
                        $.ajax({
                          url: "/LikedUsers",
                          method: "GET",
                          headers: {
                            id: item._id,
                          },
                          success: (respdata) => {
                            let tempData = structuredClone(data);
                            tempData[itemIndex].likedByUsers = respdata.items;
                            setData([...tempData]);
                            setLikedUserLoading("Complete");
                          },
                          error: (err) => {
                            setLikedUserLoading("Complete");
                            api.error({
                              message: err.responseJSON.message,
                            });
                          },
                        });
                      }
                    }
                  }}
                  content={
                    <div className="">
                      {likedUserLoading == "Loading" && (
                        <div>
                          <Spin
                            indicator={
                              <LoadingOutlined style={{ fontSize: 24 }} spin />
                            }
                          />
                        </div>
                      )}
                      {likedUserLoading == "Complete" &&
                        item.likedByUsers != undefined &&
                        item.likedByUsers.length == 0 && (
                          <div className="w-full flex flex-row h-[3rem]">
                            <div className="mx-auto font-semibold my-auto">
                              Be the first to Like !!
                            </div>
                          </div>
                        )}
                      {likedUserLoading == "Complete" &&
                        item.likedByUsers != undefined &&
                        item.likedByUsers.length != 0 && (
                          <div className="flex flex-col w-full h-[10rem] overflow-auto styledScrollbar">
                            {item.likedByUsers.map((likeUser: any) => (
                              <div className="flex flex-row gap-2 items-center">
                                <img
                                  src={likeUser.likedByUsers.image}
                                  className="w-8 h-8 rounded-full"
                                />
                                <Link
                                  to={`/Profile?${likeUser.likedByUsers._id}`}
                                  className="hover:underline hover:underline-offset-1 hover:decoration-neutral-300"
                                >
                                  <h3 className="font-semibold">
                                    {likeUser.likedByUsers.username}
                                  </h3>
                                </Link>
                                <div className="w-10">&nbsp;</div>
                                <button
                                  className="ml-auto border rounded-lg border-neutral-400 p-1 px-2 hover:bg-neutral-100 hover:text-black transition-all duration-150 ease-in-out hover:border-neutral-100 font-semibold opacity-50"
                                  onClick={() => {
                                    api.error({
                                      message: (
                                        <div className="flex flex-col w-full text-white gap-3">
                                          <div>
                                            Follow feature is only for{" "}
                                            <h3 className="text-blue-500 inline">
                                              DemoUser1
                                            </h3>{" "}
                                            &{" "}
                                            <h3 className="text-blue-500 inline">
                                              DemoUser2
                                            </h3>{" "}
                                            due to limited storage in Database.
                                          </div>
                                          <div>
                                            Please find it in the search button
                                            on left menu.
                                          </div>
                                        </div>
                                      ),
                                    });
                                  }}
                                >
                                  Follow
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                    </div>
                  }
                >
                  <div className="flex flex-row text-neutral-400 gap-2 hover:text-neutral-300 transition-all duration-150 ease-in-out hover:cursor-pointer">
                    <div>{item.likes}</div>
                    <div>{item.likes == 1 ? "Like" : "Likes"}</div>
                  </div>
                </Popover>
                <Popover
                  trigger={"click"}
                  placement="right"
                  onOpenChange={(visible) => {
                    if (visible == true) {
                      debugger;
                      fetchComments(item._id, index);
                    }
                  }}
                  content={
                    <div>
                      {commentProcessing == "Loading" && (
                        <Spin
                          indicator={
                            <LoadingOutlined style={{ fontSize: 24 }} spin />
                          }
                        />
                      )}
                      {commentProcessing == "Complete" &&
                        item.comments != undefined &&
                        item.comments.length == 0 && (
                          <div className="w-full flex flex-row h-[3rem]">
                            <div className="mx-auto font-semibold my-auto">
                              Be the first to comment !!
                            </div>
                          </div>
                        )}
                      {commentProcessing == "Complete" &&
                        item.comments != undefined &&
                        item.comments.length > 0 && (
                          <div className="flex flex-col w-[15rem] h-[15rem] overflow-auto styledScrollbar mb-3">
                            {item.comments != undefined &&
                              item.comments.map((item: any) => (
                                <div className="flex flex-row w-full">
                                  <img
                                    src={item.user.image}
                                    className="w-8 h-8 rounded-full"
                                  />
                                  <div className="flex flex-col items-start px-2 p-1">
                                    <Link
                                      to={`/Profile?${encodeURI(
                                        item.user._id
                                      )}`}
                                      className="hover:underline hover:underline-offset-1 hover:decoration-neutral-300"
                                    >
                                      <h3 className="inline font-semibold">
                                        {item.user.username}
                                      </h3>
                                    </Link>
                                    <p className="font-light">{item.content}</p>
                                  </div>
                                </div>
                              ))}
                          </div>
                        )}
                      <div className="flex flex-row gap-2 items-center">
                        <TextArea
                          value={newComment}
                          onChange={(e) => {
                            setNewComment(e.target.value);
                          }}
                        />
                        <div className="mt-auto">
                          {newComment.length > 0 && (
                            <motion.button
                              transition={{
                                delay: 0.2,
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
                              onClick={() => {
                                saveComments(newComment, item._id, index);
                              }}
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1.5}
                                stroke="currentColor"
                                className="w-9 h-9 text-neutral-200 hover:bg-neutral-600 rounded-md p-1 transition-all duration-150 ease-in-out"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
                                />
                              </svg>
                            </motion.button>
                          )}
                        </div>
                      </div>
                    </div>
                  }
                >
                  <div className=" text-neutral-500 hover:text-neutral-300 transition-all duration-150 ease-in-out hover:cursor-pointer">
                    View All Comments
                  </div>
                </Popover>
              </div>
            </div>
          ))}
        {loadStatus == "Complete" && data?.length == 0 && (
          <div className="absolute w-full top-1/3">
            <div className="relative w-full">
              <div className="flex flex-col w-6/12 lg:w-3/12 mx-auto bg-neutral-700 items-center rounded-md">
                <h3 className="text-xl text-neutral-400 p-4">
                  No Posts Available
                </h3>
                <h3 className="text-lg text-neutral-500 ">
                  Maybe you are not follwoing anyone
                </h3>
                <h5
                  className="text-md text-blue-700 p-2 hover:cursor-pointer hover:text-blue-800 transition-all duration-150 ease-in-out"
                  onClick={() => {
                    fetchPosts();
                  }}
                >
                  Try Again
                </h5>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Home;
