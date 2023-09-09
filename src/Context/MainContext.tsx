import React, {
  ReactComponentElement,
  ReactNode,
  createContext,
  useContext,
  useRef,
  useState,
} from "react";

type propType = {
  children: ReactNode;
};
export type authDataType = {
  username: string;
  loggedIn: boolean;
  image: undefined | string;
  email: string;
  id: string;
  following?: string[];
  newUser?: boolean;
  userData?: any;
  followers?: string[];
  postCount?: number;
  firstName?: string;
  lastName?: string;
};
export type modalType = {
  visible: boolean;
  user?: any[];
};
export type postTypes = {
  _id: string;
  userid: string;
  items: string[];
  likes: number;
  likedBy: string[];
  timestamp: string;
  likedByUsers?: string[];
  comments?: string[];
  body: string;
};
export type newPostType =
  | {
      visible: boolean;
      posts: string[];
    }
  | undefined;
export type notifType = {
  visible: boolean;
  notifications: string[];
};
export const mainContext = createContext<null | any>(null);
const MainContext = ({ children }: propType) => {
  const [loadStatus, setLoadStatus] = useState<
    "Complete" | "Loading" | undefined
  >(undefined);
  const [authData, setAuthData] = useState<undefined | authDataType>(undefined);
  const viewedPosts = useRef<String[] | []>([]);
  const hasMorePosts = useRef<boolean>(true);
  const [modalState, setModalState] = useState<modalType>({
    visible: false,
    user: undefined,
  });
  const [postModal, setPostModal] = useState<newPostType>({
    visible: false,
    posts: [],
  });
  const [notifModal, setNotifModal] = useState<notifType|undefined>({
    visible: false,
    notifications: [],
  });

  const [data, setData] = useState<undefined | postTypes[] | []>(undefined);
  const obj = {
    authData,
    setAuthData,
    modalState,
    setModalState,
    data,
    setData,
    viewedPosts,
    hasMorePosts,
    loadStatus,
    setLoadStatus,
    postModal,
    setPostModal,
    notifModal,
    setNotifModal
  };
  return <mainContext.Provider value={obj}>{children}</mainContext.Provider>;
};

export default MainContext;
