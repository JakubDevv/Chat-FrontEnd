import { Injectable } from '@angular/core';
import {HttpClient, HttpParams} from "@angular/common/http";
import {environment} from "../../../environments/environment";
import {FormGroup} from "@angular/forms";

const HOST = environment.apiUrl;
const BASE_URL = "/auth/";

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private http: HttpClient) { }

  public login(form: FormGroup){
    return this.http.post(HOST + BASE_URL + "login", form.getRawValue(), { withCredentials : true });
  }

  public register(form: FormGroup){
    document.cookie = "";
    return this.http.post(HOST + BASE_URL + "register", form.getRawValue(), { withCredentials : true });
  }

  public refreshToken() {
    let refreshToken = document.cookie;
    return this.http.post(HOST + BASE_URL + "access-token",{ value: refreshToken });
  }

  public validateToken() {
    return this.http.get<boolean>(HOST + BASE_URL + "validate");
  }

  public setUserPhoto(userId: number, file: File) {
    const formData = new FormData();
    formData.append("file", file);
    let param = new HttpParams().set("userId", userId);
    return this.http.post(HOST + BASE_URL + "photo", formData, { params: param });
  }
}
