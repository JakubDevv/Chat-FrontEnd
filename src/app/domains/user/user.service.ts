import { Injectable } from '@angular/core';
import {HttpClient, HttpParams} from "@angular/common/http";
import {environment} from "../../../environments/environment";

const HOST = environment.apiUrl;
const BASE_URL = "/user/";

@Injectable({
  providedIn: 'root'
})
export class UserService {

  id=0;

  constructor(private http: HttpClient) { }

  public getPersonalData(){
    return this.http.get(HOST + BASE_URL + "personal-data");
  }

  public getUsers(){
    return this.http.get(HOST + BASE_URL + "users");
  }

  public getImage(){
    return this.http.get(HOST + BASE_URL + "image");
  }

  public changeColor(color: string){
    return this.http.put(HOST + BASE_URL + "bg-color", {}, {params: {'bgColor': color}});
  }

  public getActiveFriendsCount(){
    return this.http.get(HOST + BASE_URL + "active-friends-count");
  }

  public getActiveFriends(){
    return this.http.get(HOST + BASE_URL + "active-friends");
  }

  public getNewUsers(){
    return this.http.get(HOST + BASE_URL + "new");
  }

  public getMutualFriendsUsers(){
    return this.http.get(HOST + BASE_URL + "mutual-friends");
  }

  public getFriendsCountries(){
    return this.http.get(HOST + BASE_URL + "countries");
  }

  public getSentMessagesByTime(){
    return this.http.get(HOST + BASE_URL + "messages/amount");
  }

  public getNotifications(){
    return this.http.get(HOST + BASE_URL + "notifications");
  }

  public removeNotification(notificationId: number){
    let customParams = new HttpParams().set("id", notificationId)
    return this.http.delete(HOST + BASE_URL + "notification", { params: customParams});
  }

  public getUserPhoto(userId: string | number){
    return this.http.get(HOST + BASE_URL + "profile-picture/"+userId, { responseType: 'arraybuffer' });
  }

  public updateUserPhoto(file: File){
    const formData = new FormData();
    formData.append("file", file);
    return this.http.post(HOST + BASE_URL + "profile-picture", formData);
  }

  public getFriends(){
    return this.http.get(HOST + BASE_URL + "friends");
  }
}
