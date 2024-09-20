import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {environment} from "../../../environments/environment";
import {IInterest, IInterestValue} from "./interests.types";
import {Observable} from "rxjs";

const HOST = environment.apiUrl;
const BASE_URL = "/user/";

@Injectable({
  providedIn: 'root'
})
export class InterestsService {

  constructor(private http: HttpClient) { }

  public getInterests(){
    return this.http.get(HOST + BASE_URL + "interests");
  }
  public addInterest(interest: IInterestValue){
    return this.http.post(HOST + BASE_URL + "interests", interest);
  }

  public deleteInterest(interestId: number){
    return this.http.delete(HOST + BASE_URL + "interests", { params: { id: interestId } });
  }

  public getFriendsInterests(){
    return this.http.get(HOST + BASE_URL + "friends/interests");
  }
}
