import { Injectable } from '@angular/core';
import {HttpClient, HttpParams} from "@angular/common/http";
import {environment} from "../../../environments/environment";

const HOST = environment.apiUrl;
const BASE_URL = "/group";

@Injectable({
  providedIn: 'root'
})
export class GroupService {

  activeChat: number = 0;

  constructor(private http: HttpClient) { }

  public chats(){
    return this.http.get(HOST + BASE_URL + "/chats");
  }

  public getMessages(id: number){
    return this.http.get(HOST + BASE_URL + "/chats/"+id);
  }

  public getChat(id: number){
    return this.http.get(HOST + BASE_URL + "/chats2/"+id);
  }

  public createChat(name: string, ids: number[]){
    return this.http.post(HOST + BASE_URL, {name: name, ids: ids});
  }

  public getChatPicture(id: number){
    return this.http.get(HOST + BASE_URL + "/picture/"+id, { responseType: 'arraybuffer' });
  }

  public getFile(id: number){
    return this.http.get(HOST + BASE_URL + "/message/"+id, { responseType: 'arraybuffer' });
  }

  public sendFile(file: File, chatId: number){
    const formData = new FormData();
    formData.append("file", file);
    return this.http.post(HOST + BASE_URL + "/message/"+chatId, formData);
  }

  public removeUserFromChat(chatId: number, userId: number){
    return this.http.delete(HOST + BASE_URL + "/" + chatId + "/" + userId);
  }

  public addUserToChat(chatId: number, userId: number){
    return this.http.post(HOST + BASE_URL + "/add/" + chatId + "/" + userId, {});
  }

  public leaveChat(chatId: number){
    let param = new HttpParams().set("chat_id", chatId);
    return this.http.delete(HOST + BASE_URL + "/leave", { params: param });
  }

  public removeChat(chatId: number){
    let param = new HttpParams().set("chat_id", chatId);
    return this.http.delete(HOST + BASE_URL, { params: param });
  }

  public setChatPicture(file: File, chatId: number){
    const formData = new FormData();
    formData.append("file", file);
    return this.http.post(HOST + BASE_URL + "/picture/" + chatId, formData);
  }
}
