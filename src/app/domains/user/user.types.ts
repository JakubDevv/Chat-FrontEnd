export interface UserDTO {
  id: number,
  firstName: string,
  lastName: string,
  email: string,
  country: string,
  city: string,
  unreadMessages: string
}

export interface UserDTO2 {
  user_id: number,
  bgColor: string,
  first_name: string,
  last_name: string,
  country: string,
  city: string,
  status: string | null,
  interests: string[],
  age: number,
  friends: number,
  mutualFriends: number,
  groups: number,
  mutualGroups: number,
  joined: Date,
  activityStatus: string
}

export interface UserDTO3 {
  interests: string[],
}

export interface FriendsOnline {
  onlineFriends: number,
  friends: number
}

export interface ActiveFriend {
  id: number,
  bgColor: string,
  firstName: string
}

export interface UserDTO4 {
  id: number,
  firstName: string,
  lastName: string,
  friendStatus: string,
  created: Date,
  mutualFriends: number
}

export interface NotificationDTO {
  id: number,
  user_id: number,
  user_firstName: string,
  user_lastName: string,
  sentTime: string,
  group_name: string,
  notificationType: string,
  group_id: number
}

export interface Friend {
  id: number,
  bgColor: string,
  first_name: string,
  last_name: string,
  country: string,
  city: string,
  mutualFriends: number,
  mutualGroups: number,
  activityStatus: string,
}
