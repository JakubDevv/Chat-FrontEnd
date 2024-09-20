import {NotificationDTO} from "../user/user.types";

export interface Group {
  id: number,
  lastMessageTime: string,
  lastMessage: string | null,
  unread_messages: number,
  lastMessageUserId: number | null,
  lastMessageUser: string | null,
  chatName: string,
  bgColor: string | null,
  userId: number | null,
  isChat: boolean,
  activeUsers: number,
  notificationType: string
}

export interface Message {
  id: number,
  content: string,
  photo: boolean,
  firstName: string,
  lastName: string,
  userId: number,
  dateTime: string,
  deleted: boolean,
  response_id: number,
  response_firstName: string,
  response_lastName: string,
  response_user_id: number,
  response_dateTime: string,
  response_content: string,
  response_deleted: boolean,
  ids: number[],
  chat_id: number,
  notification_type: string
}

export interface Group2 {
  id: number,
  name: Date,
  images: number,
  messages_amount: number,
  created: string,
  role: string,
  users: GroupUser[],
  onlineUsers: number,
  duo: boolean,
  notifications: NotificationDTO[];
  messages: Message[];
}

export interface GroupUser {
  id: number,
  firstName: string,
  lastName: string,
  friendStatus: string | null,
  messages: number,
  mutualFriends: number,
  userStatus: string,
  bgColor: string
}

export interface File2 {
  id: number,
  sent: string,
  firstName: string,
  lastName: string
}

export interface GroupNotificationDTO {
  id: number,
  sent: string,
  firstName: string,
  lastName: string
}
