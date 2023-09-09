import React, { useContext, useEffect, useState, useRef } from "react";
import camera from "../images/camera.png";
import home from "../images/home.png";
import search from "../images/search.png";
import add from "../images/add.png";
import notification from "../images/notifications.png";
import { type } from "os";
import { Popover } from "antd";
import $ from "jquery";
import {
  authDataType,
  mainContext,
  modalType,
  newPostType,
  notifType,
} from "../Context/MainContext";
import { Link, useNavigate } from "react-router-dom";
import useNotification from "antd/es/notification/useNotification";
type sideOptType = {
  title: string;
  icon: string;
  callback: () => void;
  badge?: number;
};
function Navbar() {
  const intervalRef = useRef(false);
  const navigate = useNavigate();
  const {
    authData,
    modalState,
    setModalState,
    postModal,
    setPostModal,
    notifModal,
    setNotifModal,
  }: {
    authData: authDataType;
    modalState: modalType;
    setModalState: React.Dispatch<React.SetStateAction<modalType>>;
    postModal: newPostType;
    setPostModal: React.Dispatch<React.SetStateAction<newPostType>>;
    notifModal: notifType;
    setNotifModal: React.Dispatch<React.SetStateAction<notifType>>;
  } = useContext(mainContext);
  const [winWidth, setWinWidth] = useState(window.innerWidth);
  useEffect(() => {
    window.addEventListener("resize", () => {
      setWinWidth(window.innerWidth);
    });
  }, []);
  const [api,contextHolder] = useNotification();
  const [sideOpt, setSideOpt] = useState<sideOptType[]>([
    {
      title: "Home",
      icon: home,
      callback: () => {
        navigate("/");
      },
    },
    {
      title: "Search",
      icon: search,
      callback: () => {
        let tempModalState = { ...modalState } as modalType;
        tempModalState.visible = true;
        setModalState({ ...tempModalState });
      },
    },
    {
      title: "New Post",
      icon: add,
      callback: () => {
        setPostModal({
          visible: true,
          posts: [],
        });
      },
    },
    {
      title: "Notifications",
      icon: notification,
      callback: () => {},
      badge: 0,
    },
  ]);
  function fetchNotification() {
    $.ajax({
      url: "/Notifications",
      method: "GET",
      headers: {
        userid: authData.id,
      },
      success: (data) => {
        debugger;
        let tempModal = { ...notifModal };
        tempModal.notifications = data.items;
        let tempsideOpt = [...sideOpt];
        tempsideOpt[3].badge = data.items.length;
        setNotifModal(tempModal);
        setTimeout(() => {
          setSideOpt([...tempsideOpt]);
        }, 50);
      },
      error: (err) => {
        debugger;
        let tempModal = structuredClone(notifModal);
        tempModal.notifications = [];
        setNotifModal({ ...tempModal });
      },
    });
  }
  useEffect(() => {
    if (
      authData != undefined &&
      authData.loggedIn == true &&
      intervalRef.current == false &&
      sideOpt != undefined
    ) {
      intervalRef.current = true;
      fetchNotification();
      setInterval(() => {
        fetchNotification();
      }, 10000);
    }
  }, [authData, sideOpt]);

  return (
    <div
      className={`flex flex-col  w-full bg-black
     text-white gap-2 p-4 ${winWidth > 1024 && "px-8"} h-full items-center`}
    >
      {contextHolder}
      <div
        className="hover:bg-neutral-700 rounded-md transition-all duration-150 ease-in-out hover:cursor-pointer p-2 "
        onClick={() => {
          navigate("/");
        }}
      >
        {winWidth <= 1024 && <img src={camera} className="w-9" />}
        {winWidth > 1024 && (
          <h3 className="font-semibold text-lg px-1">Social</h3>
        )}
      </div>
      <div className="flex flex-col my-auto gap-3 items-start mx-auto">
        {sideOpt.map((item, index) => (
          <Popover
            trigger={"hover"}
            placement="right"
            content={<div className="font-semibold">{item.title}</div>}
          >
            <div
              className="flex flex-row gap-4 items-center hover:bg-neutral-600 rounded-md transition-all duration-150 ease-in-out hover:cursor-pointer p-2 relative"
              onClick={() => {
                if (item.title == "Notifications") {
                  // if (notifModal.notifications.length > 0) {
                  //   let tempModal = structuredClone(notifModal);
                  //   tempModal.visible = true;
                  //   setNotifModal({ ...tempModal });
                  // }
                  api.info({
                    message:"Display notification popup not implemented yet"
                  })
                } else {
                  item.callback();
                }
              }}
            >
              {item.badge != undefined && item.badge > 0 && (
                <div className="absolute top-1 right-0">
                  <div className="relative w-5 h-5 rounded-full bg-red-500 text-center text-sm font-semibold ">
                    {item.badge}
                  </div>
                </div>
              )}
              <img src={item.icon} className="w-6" />
              {winWidth > 1024 && (
                <h3 className="font-semibold text-neutral-300">{item.title}</h3>
              )}
            </div>
          </Popover>
        ))}
        {authData != undefined && authData.loggedIn == true && (
          <Link to={`/Profile?${authData.id}`}>
            <div className="flex flex-row gap-4 items-center border-t border-neutral-700 py-2 hover:bg-neutral-600 rounded-md transition-all duration-150 ease-in-out hover:cursor-pointer p-2">
              <img src={authData.image} className="w-6 rounded-full" />
              {winWidth > 1024 && (
                <h3 className="font-semibold text-neutral-300">Account</h3>
              )}
            </div>
          </Link>
        )}
      </div>
    </div>
  );
}

export default Navbar;
