import {Component, OnInit} from '@angular/core';
import {MenuComponent} from "../menu/menu.component";
import {RouterOutlet} from "@angular/router";
import {GroupService} from "../domains/group/group.service";
import {File2, Group, Group2, GroupUser, Message} from "../domains/group/group.types";
import {CommonModule, DatePipe, NgForOf, NgStyle} from "@angular/common";
import {UserService} from "../domains/user/user.service";
// @ts-ignore
import SockJS from 'sockjs-client';
// @ts-ignore
import * as Stomp from 'stompjs';
import {FormsModule} from "@angular/forms";
import {DateTimePipe} from "../pipe/date-time.pipe";
import {FriendsService} from "../domains/friends/friends.service";
import {ActiveFriend, Friend, NotificationDTO} from "../domains/user/user.types";
import {DateTime2Pipe} from "../pipe/date-time-2.pipe";

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [
    MenuComponent,
    RouterOutlet,
    NgForOf,
    DatePipe,
    NgStyle,
    CommonModule,
    FormsModule,
    DateTimePipe,
    DateTime2Pipe
  ],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css'
})
export class ChatComponent implements OnInit {

  private stompClient: Stomp.Client;

  file: File | null = null;

  chat?: Group2;
  chats: Group[] = [];
  groupNotifications: Message[] = [];
  messages: Message[] = [];
  id: number = 0;
  selectedChat: number = 0;

  addUsers: boolean = false;

  allMedia = false;

  friends: Friend[] = [];

  activeFriends: ActiveFriend[] = [];
  response?: Message;

  chatPhoto: any;

  messageInput: string = '';

  all_unread_messages: number = 0;

  files: File2[] = [];

  unread_messages_selected_chat: number = 0;

  userPhotos: Map<number, any> = new Map<number, any>();

  filesPhotos: Map<number, any> = new Map<number, any>();

  constructor(private groupService: GroupService, private userService: UserService, private friendsService: FriendsService) {
  }

  ngOnInit(): void {
    this.userService.getImage().subscribe((data: any) => {
      this.id = data.id;
    });
    this.userService.getActiveFriends().subscribe((data: any) => {
      this.activeFriends = data;
    });

    this.groupService.chats().subscribe((data: any) => {
      this.chats = data;
      this.chats.forEach(chat => this.setChatPhoto(chat));
      if (this.groupService.activeChat != 0) {
        let find = this.chats.find(chat => chat.userId == this.groupService.activeChat);
        if (find) {
          this.selectChat(find.id)
          this.all_unread_messages = this.chats.reduce((total, chat) => total + chat.unread_messages, 0);
          this.groupService.activeChat = 0;
        }
      } else {
        this.selectChat(this.chats[0].id);
        this.all_unread_messages = this.chats.reduce((total, chat) => total + chat.unread_messages, 0);
      }
    });
  }


  isFirstMessageOfDay(message: { dateTime: any }, index: number): boolean {
    if (index === 0) {
      return true;
    }

    const currentDate = new Date(message.dateTime);
    const previousDate = new Date(this.messages[index - 1].dateTime);

    return (
      currentDate.getDate() !== previousDate.getDate() ||
      currentDate.getMonth() !== previousDate.getMonth() ||
      currentDate.getFullYear() !== previousDate.getFullYear()
    );

  }

  getDay(date: Date | string): string {
    const date2 = new Date();
    const currentDate = new Date(date);
    if (
      date2.getDate() == currentDate.getDate() &&
      date2.getMonth() == currentDate.getMonth() &&
      date2.getFullYear() == currentDate.getFullYear()
    ) {
      return "Today";
    } else if (
      date2.getDate() - 1 == currentDate.getDate() &&
      date2.getMonth() == currentDate.getMonth() &&
      date2.getFullYear() == currentDate.getFullYear()
    ) {
      return "Yesterday";
    } else {
      return currentDate.getDate().toString().padStart(2, '0') + "." + (currentDate.getMonth() + 1).toString().padStart(2, '0');
    }
  }

  selectChat(id: number) {
    this.selectedChat = id;
    this.response = undefined;
    this.unread_messages_selected_chat = 0;
    this.messages = [];
    this.groupNotifications = [];

    this.updateUnreadMessages(id);

    this.groupService.getChatPicture(id).subscribe((data: any) => {
      this.chatPhoto = this.arrayBufferToImageUrl(data);
    });
    this.groupService.getChat(id).subscribe((data: any) => {

      this.messages = data.messages;
      this.groupNotifications = this.messages.filter(message => message.notification_type != null);

      this.files = this.messages
        .filter(message => message.photo && !message.deleted)
        .map(message => ({
          id: message.id,
          sent: message.dateTime,
          firstName: message.firstName,
          lastName: message.lastName
        }));

      this.messages.filter(message => message.photo).forEach(message => {
        this.groupService.getFile(message.id).subscribe((data: any) => {
          this.filesPhotos.set(message.id, this.arrayBufferToImageUrl(data));
        });
      });

      data.onlineUsers = data.users.reduce((total: number, user: GroupUser) => {
        if (user.userStatus == 'ONLINE') {
          return total + 1
        }
        return total;
      }, 0);
      this.chat = data;
      new Set(this.messages.filter(message => message.notification_type != null).flatMap(message => message.userId)).forEach(message => {
        if(!this.userPhotos.has(message))
          this.userService.getUserPhoto(message).subscribe((data: any) => {
            this.userPhotos.set(message, this.arrayBufferToImageUrl(data));
          });
      });
      this.userService.getFriends().subscribe((data: any) => {
        this.friends = data;
        this.friends = this.friends.filter(friend => !this.chat?.users.map(user => user.id).includes(friend.id));
        this.friends.forEach(friend => {
          if(!this.userPhotos.has(friend.id))
            this.userService.getUserPhoto(friend.id).subscribe((data: any) => {
              this.userPhotos.set(friend.id, this.arrayBufferToImageUrl(data));
            })
        })
      });
    });
    if (this.stompClient && this.stompClient.connected) {
      this.stompClient.disconnect();
    }
    const socket = new SockJS('http://localhost:8080/chat');
    this.stompClient = Stomp.over(socket);
    this.stompClient.connect({}, (frame: any) => {
        this.stompClient.subscribe('/topic/user/' + this.id, (response: any) => {
          let message: Message = JSON.parse(response.body);
          let selectedChat = this.chats.find(chat => chat.id == message.chat_id);
          if (selectedChat)
            if (message.chat_id == this.selectedChat) {
              this.messages.push(message);

              this.notificationMessage(message);
              this.photoMessage(message);

              if (this.unread_messages_selected_chat > 0) ++this.unread_messages_selected_chat;
              this.stompClient.send('/app/chat/messages/' + this.selectedChat, {}, JSON.stringify({'id': this.id}));
              this.updateMessagesAmount(message);
              this.updateChat(selectedChat, message, false);
            } else {
              this.updateChat(selectedChat, message, true);
            }
          this.updateChatsOrder();
        });
        this.stompClient.subscribe('/topic/messages/2/' + id, (response: any) => {
          let userId: number = JSON.parse(response.body);
          this.updateUserActivityInChat(userId);
        });
        this.stompClient.subscribe('/topic/messages/3/' + id, (response: any) => {
            let messageId: number = JSON.parse(response.body);
            this.updateMessageStatusDeleted(messageId);
          }
        )
      }
    );
  }

  onFileSelected($event: Event) {
    // @ts-ignore
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.file = input.files[0];
      if (this.chat)
        this.groupService.sendFile(this.file, this.chat?.id).subscribe((data: any) => {
        });
    } else {
      this.file = null;
    }
  }

  selectChatByUserId(id: number) {
    let find = this.chats.find(chat => chat.userId == id);
    if (find)
      this.selectChat(find.id);
  }

  updateChat = (chat: Group, message: Message, incrementUnread: boolean) => {
    chat.lastMessageTime = message.dateTime;
    chat.lastMessageUserId = message.userId;
    chat.lastMessage = message.content;
    chat.lastMessageUser = `${message.firstName} ${message.lastName}`;
    chat.notificationType = message.notification_type;
    if (incrementUnread) {
      ++chat.unread_messages;
      ++this.all_unread_messages;
    }
  };

  updateChatsOrder = () => {
    this.chats = this.chats.sort((a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime());
  };

  getChatPhoto = (chat: Group2 | undefined) => {
    if (chat?.duo) {
      let user = chat.users.filter(user => user.id != this.id).shift();
      if (user)
        return this.userPhotos.get(user.id)
    } else {
      if (chat) {
        return this.chatPhoto;
      }
    }
  };

  getChatBackground = (chat: Group2 | undefined) => {
    if (chat?.duo) {
      let user = chat.users.filter(user => user.id != this.id).shift();
      if (user)
        return user.bgColor;
    }
    return '#FFFFFF';
  };

  arrayBufferToImageUrl = (data: any) => {
    const uint8Array = new Uint8Array(data);
    const binaryString = uint8Array.reduce((acc, byte) => acc + String.fromCharCode(byte), '');
    const base64String = btoa(binaryString);
    return `data:image/jpeg;base64,${base64String}`;
  }

  sendMessage($event: any) {
    if (this.messageInput !== '')
      this.stompClient!.send(
        '/app/chat/' + this.selectedChat,
        {},
        JSON.stringify({
          sender_id: this.id,
          content: this.messageInput,
          response_id: this.response ? this.response.id : 0,
          media: false,
        })
      );
    this.response = undefined;
    this.messageInput = '';
  }

  acceptFriendRequest(userId: number) {
    this.friendsService.acceptFriendRequest(userId).subscribe((data: any) => {
      this.setFriendStatusByUserId(userId, 'ACCEPTED');
    });
  }

  removeFriend(userId: number) {
    this.friendsService.removeFriend(userId).subscribe((data: any) => {
      this.setFriendStatusByUserId(userId, null);
      this.removeChatByUserId(userId);
    });
  }

  createFriendRequest(userId: number) {
    this.friendsService.createFriendRequest(userId).subscribe((data: any) => {
      this.setFriendStatusByUserId(userId, 'PENDING');
    });
  }

  removeMessage(message: Message) {
    this.stompClient!.send('/app/chat/messages/delete/' + this.selectedChat,
      {},
      JSON.stringify({
        id: message.id
      })
    );
  }

  createResponse(message: Message) {
    this.response = message;
  }

  receiveNotifications(notification: NotificationDTO) {
    if (notification.notificationType == 'GROUP_ADDED') {
      this.chats.push({
        id: notification.group_id,
        lastMessageTime: notification.sentTime,
        lastMessage: null,
        unread_messages: 0,
        lastMessageUserId: null,
        lastMessageUser: notification.user_firstName + " " + notification.user_lastName,
        chatName: notification.group_name,
        bgColor: null,
        userId: null,
        isChat: true,
        activeUsers: 0,
        notificationType: notification.notificationType
      })
    } else if (notification.notificationType == 'GROUP_KICKED' || notification.notificationType == 'GROUP_REMOVED') {
      let index = this.chats.findIndex(chat => chat.chatName == notification.group_name);
      if (index > -1)
        this.chats.splice(index, 1);
      if (this.selectedChat == notification.group_id)
        window.location.reload();
    } else if (notification.notificationType == 'FRIEND_REMOVED') {
      let index = this.chats.findIndex(chat => chat.userId == notification.user_id);
      if (index > -1)
        this.chats.splice(index, 1);
      if (this.selectedChat == notification.group_id)
        window.location.reload();
    }

  }

  setProfilePicture(userId: string | number, imageData: ArrayBuffer):
    void {
    const blob = new Blob([imageData], {type: 'image/png'});
    let element = (<HTMLInputElement>document.getElementById(userId.toString()));
    element.src = URL.createObjectURL(blob);
  }

  removeUserFromChat(user: GroupUser) {
    this.groupService.removeUserFromChat(this.selectedChat, user.id).subscribe((data: any) => {
      let index = this.chat?.users.findIndex(chatUser => chatUser.id == user.id);
      if (index)
        if (index > -1)
          this.chat?.users.splice(index, 1);
      this.friends.push({
        id: user.id,
        bgColor: user.bgColor,
        first_name: user.firstName,
        last_name: user.lastName,
        country: "",
        city: "",
        mutualFriends: user.mutualFriends,
        mutualGroups: 0,
        activityStatus: user.userStatus
      })
    });
  }

  getOnlineUsersInChat(){
    return this.chat?.users.filter(user => user.userStatus == 'ONLINE' && user.id !== this.id);
  }

  showAllMedia() {
    this.allMedia = true;
  }

  addUserToChat(friend: Friend) {
    if (this.chat)
      this.groupService.addUserToChat(this.chat.id, friend.id).subscribe((data: any) => {
        this.chat?.users.push(
          {
            id: friend.id,
            firstName: friend.first_name,
            lastName: friend.last_name,
            friendStatus: 'ACCEPTED',
            messages: 0,
            mutualFriends: friend.mutualFriends,
            userStatus: friend.activityStatus,
            bgColor: friend.bgColor
          }
        )
        let index = this.friends.findIndex(friends => friends == friend);
        if (index > -1)
          this.friends.splice(index, 1);
      });
  }

  leaveChat() {
    if (this.chat)
      this.groupService.leaveChat(this.chat.id).subscribe((data: any) => {
        window.location.reload();
      });
  }

  removeChat() {
    if (this.chat)
      this.groupService.removeChat(this.chat.id).subscribe((data: any) => {
        window.location.reload();
      });
  }

  setFriendStatusByUserId = (userId: number, friendStatus: string | null) => {
    let find = this.chat?.users.find(user => user.id == userId);
    if (find) {
      find.friendStatus = friendStatus;
    }
  }

  removeChatByUserId = (userId: number) => {
    let chatIndex = this.chats.findIndex(chat => chat.userId == userId);
    if (chatIndex > -1) {
      this.chats.splice(chatIndex, 1);
    }
  }

  updateUserActivityInChat = (userId: number) => {
    let index = this.messages.findIndex(message => message.ids.includes(userId));
    if (index > -1) {
      let number = this.messages[index].ids.findIndex(id => id === userId);
      if (number > -1) {
        this.messages[index].ids.splice(number, 1);
        this.messages[this.messages.length - 1].ids.push(userId);
      }
    } else {
      this.messages[this.messages.length - 1].ids.push(userId);
    }
  }

  updateMessageStatusDeleted = (messageId: number) => {
    let message = this.messages.find(message => message.id == messageId);
    this.messages.filter(message => message.response_id == messageId).forEach(message => message.response_deleted = true);
    if (message)
      message.deleted = true;
    let fileIndex = this.files.findIndex(file => file.id === message?.id);
    this.files.splice(fileIndex, 1);
  }

  kickUserFromChat = (userId: number) => {
    let index = this.messages.findIndex(message => message.ids.includes(userId));
    if (index > -1) {
      let number = this.messages[index].ids.findIndex(id => id === userId);
      if (number > -1) {
        this.messages[index].ids.splice(number, 1);
      }
    }
    if (this.chat) {
      let userIndex = this.chat.users.findIndex(user => user.id == userId);
      if (userIndex > -1)
        this.chat?.users.splice(userIndex, 1)
    }
  }

  addUserToChat2 = (message: Message) => {
    if(this.chat?.role != "OWNER")
    this.chat?.users.push({
        id: message.userId,
        firstName: message.firstName,
        lastName: message.lastName,
        friendStatus: 'x',
        messages: 0,
        mutualFriends: 0,
        userStatus: 'OFFLINE',
        bgColor: '#FFFFFF'
      });
  }

  updateMessagesAmount = (message: Message) => {
    if (this.chat && message.notification_type == null) {
      let user = this.chat.users.find(user => user.id == message.userId);
      if (user)
        ++user.messages;
      ++this.chat.messages_amount;
    }
  }

  notificationMessage(message: Message) {
    if (message.notification_type != null) {
      this.groupNotifications.push(message);
      if (message.notification_type == 'GROUP_KICKED') {
        this.kickUserFromChat(message.userId);
      } else if (message.notification_type == 'GROUP_ADDED') {
        this.addUserToChat2(message);
      } else if (message.notification_type == 'GROUP_LEFT') {
        this.kickUserFromChat(message.userId);
      } else if (message.notification_type == 'GROUP_LEFT') {
        this.kickUserFromChat(message.userId);
      }
    }
  }

  photoMessage = (message: Message) => {
    if (message.photo) {
      this.groupService.getFile(message.id).subscribe((data: any) => {
        this.filesPhotos.set(message.id, this.arrayBufferToImageUrl(data));
        this.files.push({
          id: message.id,
          sent: message.dateTime,
          firstName: message.firstName,
          lastName: message.lastName
        });
      });
    }
  }

  setChatPhoto = (chat: Group) => {
    if (chat.isChat && chat.userId != 0 && chat.userId) {
      this.userService.getUserPhoto(chat.userId).subscribe((data: any) => {
        if (chat.userId != 0)
          this.setProfilePicture('chat' + chat.id, data);
      });
    } else {
      this.groupService.getChatPicture(chat.id).subscribe((data: any) => {
        this.setProfilePicture('chat' + chat.id, data);
      });
    }
  }

  updateUnreadMessages = (id: number) => {
    let chat = this.chats.find(chat => chat.id == id);
    if (chat) {
      this.unread_messages_selected_chat = chat.unread_messages;
      chat.unread_messages = 0;
      this.all_unread_messages = this.all_unread_messages - this.unread_messages_selected_chat;
    }
  }

  getUserPhoto = (index: number) => {
    // @ts-ignore
    return this.userPhotos.get(this.chat.users[index].id)
  }

}
