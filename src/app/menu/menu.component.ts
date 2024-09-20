import {Component, EventEmitter, Input, OnInit, Output, signal} from '@angular/core';
import {RouterLink, RouterLinkActive} from "@angular/router";
import {NgClass, NgForOf, NgIf} from "@angular/common";
import {UserService} from "../domains/user/user.service";
import {NotificationDTO} from "../domains/user/user.types";
import {DateTimePipe} from "../pipe/date-time.pipe";
// @ts-ignore
import SockJS from 'sockjs-client';
// @ts-ignore
import * as Stomp from 'stompjs';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive,
    NgClass,
    DateTimePipe,
    NgIf,
    NgForOf
  ],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.css'
})
export class MenuComponent implements OnInit{

  private stompClient: Stomp.Client;

  @Input() bgColor2: string = '#FFFFFF';
  id: number = 0;
  notification= false;
  notifications: NotificationDTO[] = [];
  notificationType: string = "ALL";
  @Output() dataGroupEmitter = new EventEmitter<NotificationDTO>();
  @Output() dataUsersEmitter = new EventEmitter<NotificationDTO>();
  userPhotos: Map<number, any> = new Map<number, any>();

  constructor(private userService: UserService) {
  }

  ngOnInit(): void {
    this.userService.getImage().subscribe((data: any) => {
      this.bgColor2 = data.bgColor;
      this.id = data.id;
      this.userService.getUserPhoto(this.id.toString()).subscribe((data: any) => {
        this.setProfilePicture(this.id.toString(), data);
      })
    });
    this.userService.getNotifications().subscribe((data: any) => {
      this.notifications = data;
      new Set<number>([...this.notifications.map(notification => notification.user_id)]).forEach(userId => {
        this.userService.getUserPhoto(userId).subscribe((data: any) => {
          this.userPhotos.set(userId, this.arrayBufferToImageUrl(data));
        });
      });
    });
    const socket = new SockJS('http://localhost:8080/chat');
    this.stompClient = Stomp.over(socket);
    this.stompClient.connect({}, (frame: any) => {
      this.stompClient.subscribe(
        '/topic/notifications/' + this.id,
        (response: any) => {
          let notification = JSON.parse(response.body);
          this.notifications.unshift(notification);
          if(!this.userPhotos.has(notification.user_id)) {
            this.userService.getUserPhoto(notification.user_id).subscribe((data: any) => {
              this.userPhotos.set(notification.user_id, this.arrayBufferToImageUrl(data));
            });
          }
          if(notification.notificationType.startsWith('FRIEND')) {
            this.sendNotificationToUsers(notification);
          }
          if(notification.notificationType.startsWith('GROUP') || notification.notificationType == 'FRIEND_REMOVED') {
            this.sendNotificationToGroups(notification);
          }
        });
    });
  }

  arrayBufferToImageUrl = (data: any) => {
    const uint8Array = new Uint8Array(data);
    const binaryString = uint8Array.reduce((acc, byte) => acc + String.fromCharCode(byte), '');
    const base64String = btoa(binaryString);
    return `data:image/jpeg;base64,${base64String}`;
  }

  openNotifications() {
    this.notification = !this.notification;
  }

  sendNotificationToGroups(notification: NotificationDTO) {
    this.dataGroupEmitter.emit(notification);
  }

  sendNotificationToUsers(notification: NotificationDTO) {
    this.dataUsersEmitter.emit(notification);
  }

  filterNotifications(type: string) {
    this.notificationType = type;
  }

  setProfilePicture(userId: string, imageData: ArrayBuffer): void {
    const blob = new Blob([imageData], { type: 'image/png' });
    let element = (<HTMLInputElement> document.getElementById(userId.toString()));
    element.src = URL.createObjectURL(blob);
  }

  removeNotification(id: number) {
    this.userService.removeNotification(id).subscribe((data: any) => {
      let index = this.notifications.findIndex(notification => notification.id == id);
      this.notifications.splice(index, 1);
    })
  }

}
