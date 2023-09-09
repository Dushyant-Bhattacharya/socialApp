import React, { useState, useContext, useEffect } from "react";
import {
  authDataType,
  mainContext,
  newPostType,
} from "../../Context/MainContext";
import { Button, Carousel, Mentions } from "antd";
import useNotification from "antd/es/notification/useNotification";
import $ from "jquery";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
function NewPosts() {
  const {
    postModal,
    setPostModal,
    authData,
  }: {
    postModal: newPostType;
    setPostModal: React.Dispatch<React.SetStateAction<newPostType>>;
    authData: undefined | authDataType;
  } = useContext(mainContext);
  const [api, contextHolder] = useNotification();
  const [users, setUsers] = useState<any>([]);
  const [text, setText] = useState("");
  const [currentslide, setCurrentSlide] = useState(0);
  const navigate = useNavigate();
  useEffect(() => {
    if (postModal?.visible == true && authData != undefined) {
      $.ajax({
        url: "/Users",
        method: "GET",
        headers: {
          id: authData.id,
        },
        success: (data: any) => {
          let user: any = data.items;
          user = user.map((item: any) => {
            return {
              value: item.username,
              label: (
                <div className="flex flex-row gap-3 px-2 items-center">
                  <img src={item.image} className="w-8 h-8 rounded-full" />
                  <div>{item.username}</div>
                </div>
              ),
            };
          });

          setUsers([...user]);
        },

        error: (err: any) => {
          // error
          setUsers([]);
        },
      });
    }
  }, [postModal]);
  function getPhotos(event: any) {
    let reader = new FileReader();
    let file: any = event.target.files ? event.target.files[0] : "";
    event.target.value = "";
    reader.readAsDataURL(file);

    reader.addEventListener("load", (readerEvent) => {
      debugger;
      let data: any = readerEvent.target?.result;
      if (data.includes("data:image") == true) {
        if (postModal != undefined) {
          let tempPostData = structuredClone(postModal);
          if (tempPostData.posts.length < 2) {
            tempPostData.posts.push(data);
          } else {
            api.error({
              message:
                "Due to limited storage , only 2 photos are allowed for a post",
            });
          }
          setPostModal({ ...tempPostData });
        }
      } else {
        api.error({
          message: "Only Image format is supported",
        });
      }
    });
  }
  return (
    <div className="w-full relative">
      {contextHolder}
      <input
        type="file"
        className="hidden"
        id="postSelect"
        onChange={(event) => {
          getPhotos(event);
        }}
      />
      <h3 className="font-bold text-neutral-300 text-lg">Create New Posts</h3>
      {postModal?.posts != undefined && postModal?.posts.length > 0 && (
        <div className="w-full h-full relative flex flex-row">
          <div className="mx-auto my-auto relative flex flex-col items-center gap-2 ">
            <div className="flex flex-row w-full">
              <Button
                type="text"
                danger
                className=" text-blue-500 hover:"
                onClick={() => {
                  let tempPostData = structuredClone(postModal);
                  tempPostData.posts.splice(currentslide, 1);
                  setPostModal({ ...tempPostData });
                  setCurrentSlide(0);
                }}
              >
                Delete
              </Button>
              <Button
                type="primary"
                className="ml-auto text-blue-500 hover:"
                onClick={() => {
                  document.getElementById("postSelect")?.click();
                }}
              >
                Add
              </Button>
            </div>
            {postModal.posts.length > 0 && (
              <div className="w-[25rem]">
                <Carousel
                  afterChange={(event) => {
                    console.log(event);
                    setCurrentSlide(event);
                  }}
                >
                  {postModal.posts.map((post) => (
                    <div className="">
                      <img src={post} className="mx-auto w-full " />
                    </div>
                  ))}
                </Carousel>
              </div>
            )}

            <div className="flex flex-row gap-2 w-full">
              <Mentions
                value={text}
                className="p-2"
                rows={4}
                onChange={(e) => {
                  setText(e);
                }}
                placeholder="Texts & Mentions"
                options={users}
              />
              <div className="mt-auto">
                {text.length > 0 && (
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
                      $.ajax({
                        url: "/CreatePosts",
                        method: "POST",
                        contentType: "application/json",
                        dataType: "json",
                        headers: {
                          username: authData?.username,
                        },
                        data: JSON.stringify({
                          items: postModal.posts,
                          body: text,
                          userid: authData?.id,
                        }),
                        success: (data) => {
                          api.success({
                            message: "Post Created Successfully",
                          });
                          setTimeout(() => {
                            setPostModal({
                              visible: false,
                              posts: [],
                            });
                            if (authData != undefined) {
                              navigate(`/Profile?${encodeURI(authData.id)}`);
                            }
                          }, 200);
                        },
                        error: (err) => {
                          api.error({
                            message: err.responseJSON.message,
                          });
                        },
                      });
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
        </div>
      )}
      {postModal?.posts != undefined && postModal?.posts.length == 0 && (
        <div className="w-full min-h-[15rem] relative  flex flex-row">
          <div className="flex flex-col mx-auto my-auto items-center gap-3">
            <div
              className=" border-2 border-neutral-200 rounded-full w-14 h-14 flex flex-row group hover:bg-neutral-200 transition-all duration-150 ease-in-out"
              onClick={() => {
                document.getElementById("postSelect")?.click();
              }}
            >
              <button className=" mx-auto my-auto text-3xl pb-1 group-hover:text-black transition-all duration-150 ease-in-out">
                +
              </button>
            </div>
            <h3 className="text-neutral-400">
              Select a photo (Only 2 images are allowed per post)
            </h3>
          </div>
        </div>
      )}
    </div>
  );
}

export default NewPosts;
