import React, { useContext, useEffect, useState, useRef } from "react";
import { authDataType, mainContext, postTypes } from "../Context/MainContext";
import $ from "jquery";
function useFetchPosts() {
  const {
    hasMorePosts,
    viewedPosts,
    authData,
    data,
    setData,
    loadStatus,
    setLoadStatus,

  }: {
    hasMorePosts: React.MutableRefObject<boolean>;
    viewedPosts: React.MutableRefObject<[] | String[]>;
    authData: authDataType;
    data: postTypes[];
    setData: React.Dispatch<React.SetStateAction<postTypes[] | [] | undefined>>;
    loadStatus: "Complete" | "Loading" | undefined;
    setLoadStatus: React.Dispatch<
      React.SetStateAction<"Complete" | "Loading" | undefined>
    >;
  } = useContext(mainContext);

  function fetchPostsCall(skip: number, limit: number, following?: string[],forceReload?:boolean) {
    let tempFollowing: any = undefined;
    if (following != undefined) {
      tempFollowing = following;
    } else {
      tempFollowing = authData.following;
    }
    $.ajax({
      url: "/GetPosts",
      method: "GET",
      headers: {
        viewed_post: viewedPosts.current.join(","),
        following: tempFollowing.join(","),
        skip: skip.toString(),
        limit: limit.toString(),
      },
      success: (respdata) => {
        let viewed = viewedPosts.current;
        let tempData: any = undefined;
        if (data != undefined) {
          tempData = [...data, ...respdata.items];
        } else {
          tempData = respdata.items;
        }
        if(forceReload == true)
        {
            tempData= respdata.items;
        }
        tempData.forEach((element: any, index: number) => {
          // @ts-ignore
          viewed.push(element._id);
          if (index == tempData.length - 1) {
            tempData[index].ref = true;
          } else {
            tempData[index].ref = false;
          }

        });
        hasMorePosts.current = respdata.hasMore;
        setData(tempData);

        setLoadStatus("Complete");
      },
      error: (err) => {
        setData([]);
        setLoadStatus("Complete");
      },
    });
  }

  function fetchPosts(skip = 0, limit = 5) {
    debugger;
    if (hasMorePosts.current == true) {
      setLoadStatus("Loading");
      fetchPostsCall(skip, limit);
    }
  }
  return { fetchPosts, fetchPostsCall };
}

export default useFetchPosts;
