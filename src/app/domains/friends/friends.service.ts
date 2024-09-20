import {environment} from "../../../environments/environment";
import {Injectable} from "@angular/core";
import {HttpClient} from "@angular/common/http";

const HOST = environment.apiUrl;
const BASE_URL = "/friend";

@Injectable({
  providedIn: 'root'
})
export class FriendsService {

  id=0;

  constructor(private http: HttpClient) { }

  public removeFriend(userId: number){
    return this.http.delete(HOST + BASE_URL, { params : {'userId': userId} });
  }

  public acceptFriendRequest(userId: number){
    return this.http.put(HOST + BASE_URL, {}, {params: {'userId': userId}});
  }

  public createFriendRequest(userId: number){
    return this.http.post(HOST + BASE_URL, {}, {params: {'userId': userId}});
  }
}
