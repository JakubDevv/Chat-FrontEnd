import {Component, ElementRef, OnInit, signal, ViewChild} from "@angular/core";
import {MenuComponent} from "../menu/menu.component";
import {CommonModule, NgOptimizedImage} from "@angular/common";
import {NotificationDTO, UserDTO2} from "../domains/user/user.types";
import {UserService} from "../domains/user/user.service";
import {SearchPipe} from "../pipe/search.pipe";
import {FormsModule} from "@angular/forms";
import {FriendsService} from "../domains/friends/friends.service";
import {IInterestStats} from "../domains/interests/interests.types";
import {GroupService} from "../domains/group/group.service";
import {Router} from "@angular/router";

@Component({
  selector: 'app-add',
  standalone: true,
  imports: [
    MenuComponent,
    CommonModule,
    SearchPipe,
    FormsModule,
    NgOptimizedImage
  ],
  templateUrl: './add.component.html',
  styleUrl: './add.component.css'
})
export class AddComponent implements OnInit {

  file: File | null = null;

  @ViewChild('avgAge') avgAge!: ElementRef;
  avgAgeVal: number=0;

  minRange: number = 0;
  maxRange: number = 99;
  minValue: number = 0;
  maxValue: number = 99;
  priceGap: number = 1;

  pending: number = 0;
  toAccept: number = 0;

  countries: boolean=false;
  interests: boolean=false;

  countriesVal: Set<string> = new Set<string>();
  interestsVal: Set<string> = new Set<string>();

  interests2: IInterestStats[] = [];

  users: UserDTO2[] = [];
  users2: UserDTO2[] = [];

  searchText: string = '';
  friendsIds: number[] = [];

  groupName="";
  groupUsers: UserDTO2[] = [];
  onlineUsers: number=0;

  interestsSearch: Set<string> = new Set<string>();
  countriesSearch: Set<string> = new Set<string>();

  activeFilters: string[] = ['ALL'];

  userPhotos =  new Map<number, any>;

  constructor(private userService: UserService, private friendsService: FriendsService, private groupService: GroupService, private router: Router) {
  }

  ngOnInit(): void {
    this.userService.getUsers().subscribe((data: any) => {
      this.users = data;
      this.users2 = data;
      this.calculateStats();
      this.friendsIds = this.users.filter(user => user.status == 'ACCEPTED').map(user => user.user_id);
      this.users.forEach(user => {
        user.interests.forEach(interest => { this.interestsVal.add(interest) });
        this.countriesVal.add(user.country);
        this.userService.getUserPhoto(user.user_id.toString()).subscribe((data: any) => {
          const uint8Array = new Uint8Array(data);
          const binaryString = uint8Array.reduce((acc, byte) => acc + String.fromCharCode(byte), '');
          const base64String = btoa(binaryString);
          this.userPhotos.set(user.user_id, `data:image/jpeg;base64,${base64String}`);
        });
      });
      this.onlineUsers = this.users.filter(user => user.activityStatus === "ONLINE").length;
      this.toAccept=this.users.filter(user => user.status === "TO_ACCEPT").length;
      this.pending=this.users.filter(user => user.status === "PENDING").length;
    });
  }

  get leftPercentage(): number {
    return (this.minValue / this.maxRange) * 100;
  }

  get rightPercentage(): number {
    return 100 - (this.maxValue / this.maxRange) * 100;
  }

  updateMinRange(event: Event): void {
    const target = event.target as HTMLInputElement;
    const value = parseInt(target.value, 10);

    if (value <= this.maxValue - this.priceGap) {
      this.minValue = value;
    } else {
      target.value = String(this.minValue);
    }

    this.search();
  }

  updateMaxRange(event: Event): void {
    const target = event.target as HTMLInputElement;
    const value = parseInt(target.value, 10);

    if (value >= this.minValue + this.priceGap) {
      this.maxValue = value;
    } else {
      target.value = String(this.maxValue);
    }

    this.search();
  }

  selectCountry(country: string) {
    if (this.countriesSearch.has(country)) {
      this.countriesSearch.delete(country);
    } else {
      this.countriesSearch.add(country);
    }
    this.countries=false;
    this.search();
  }

  selectInterest(interest: string) {
    if(this.interestsSearch.has(interest)){
      this.interestsSearch.delete(interest);
    } else {
      this.interestsSearch.add(interest);
    }
    this.interests=false;
    this.search();
  }

  acceptFriendRequest(userId: number){
    this.friendsService.acceptFriendRequest(userId).subscribe(() => {
      let find = this.users.find(user => user.user_id == userId);
      if (find) {
        find.status = 'ACCEPTED';
      }
      let find2 = this.users2.find(user => user.user_id == userId);
      if (find2) {
        find2.status = 'ACCEPTED';
      }
      --this.toAccept;
    });
    this.friendsIds.push(userId);
  }

  removeFriend(userId: number){
    this.friendsService.removeFriend(userId).subscribe(() => {
      let find = this.users.find(user => user.user_id == userId);
      if (find) {
        find.status = null;
      }
      let find2 = this.users2.find(user => user.user_id == userId);
      if (find2) {
        find2.status = null;
      }
      let index = this.friendsIds.findIndex(friend => friend === userId);
      this.friendsIds.splice(index, 1);
    });
  }

  createFriendRequest(userId: number){
    this.friendsService.createFriendRequest(userId).subscribe(() => {
      let find = this.users.find(user => user.user_id == userId);
      if (find) {
        find.status = 'PENDING';
        this.pending++;
      }
    });
  }

  calculateInterestStats(users: UserDTO2[]): IInterestStats[] {
    const interestCountMap: { [interest: string]: number } = {};

    for (const user of users) {
      for (const interest of user.interests) {
        if (interestCountMap[interest]) {
          interestCountMap[interest]++;
        } else {
          interestCountMap[interest] = 1;
        }
      }
    }

    const totalCount = users.length;
    const interestStats: IInterestStats[] = [];

    for (const interest in interestCountMap) {
      if (interestCountMap.hasOwnProperty(interest)) {
        const count = interestCountMap[interest];
        const percentage = (count / totalCount) * 100;
        interestStats.push({ value: interest, percentage });
      }
    }

    return interestStats.sort((a: IInterestStats, b: IInterestStats) =>  b.percentage - a.percentage);
  }

  changeAvgAge(value: number){
    this.avgAge.nativeElement.style.setProperty('--value', value);
  }

  calculateStats(){
    this.avgAgeVal = Math.round(this.users.map(user => user.age).reduce((sum, age) => sum + age, 0) / this.users.length);
    this.changeAvgAge(this.avgAgeVal);
    this.interests2 = this.calculateInterestStats(this.users);
  }

  search() {
    this.users = this.users2.filter(user => {
      const matchesCountry = this.countriesSearch.size === 0 || this.countriesSearch.has(user.country);
      const matchesInterests = this.interestsSearch.size === 0 || Array.from(this.interestsSearch).every(interest => user.interests.includes(interest));
      const matchesAge = user.age <= this.maxValue && user.age >= this.minValue;
      const isOnline = user.activityStatus == 'ONLINE';
      const isFriend = user.status == 'ACCEPTED';
      if(this.activeFilters.includes('ALL')){
        if(this.activeFilters.includes('ONLINE')){
          return matchesCountry && matchesInterests && matchesAge && isOnline;
        }
        return matchesCountry && matchesInterests && matchesAge;
      }
      if(this.activeFilters.includes('FRIENDS')){
        if(this.activeFilters.includes('ONLINE')) {
          return matchesCountry && matchesInterests && matchesAge && isFriend && isOnline;
        }
        return matchesCountry && matchesInterests && matchesAge && isFriend;
      }
      return matchesCountry && matchesInterests && matchesAge;
    });
    this.calculateStats();
  }

  openChat(userId: number){
    this.groupService.activeChat = userId;
    this.router.navigate(['/chat']);
  }

  createChat(){
    let numbers = this.groupUsers.map(user => user.user_id);
      this.groupService.createChat(this.groupName, numbers).subscribe((data: any) => {
        this.groupName = '';
        this.groupUsers = [];
        this.groupService.setChatPicture(this.file as File, data).subscribe((data: any) => {});
      });
  }

  selectUsers(category: string) {
    if(this.activeFilters.includes('ALL') && category == 'FRIENDS'){
      this.activeFilters.push(category)
      this.activeFilters.splice(this.activeFilters.findIndex(filter => filter === 'ALL'), 1);
    } else if (this.activeFilters.includes('FRIENDS') && category == 'ALL') {
      this.activeFilters.push(category)
      this.activeFilters.splice(this.activeFilters.findIndex(filter => filter === 'FRIENDS'), 1);
    }
    if(category=='ONLINE'){
      let index = this.activeFilters.findIndex(filter => filter === category);
      if(index > -1){
        this.activeFilters.splice(index, 1);
      } else {
        this.activeFilters.push(category);
      }
    }
    this.search();
  }

  protected readonly Array = Array;

  removeUserFromGroup(user: any) {
    let index = this.groupUsers.findIndex(groupUser => groupUser === user);
    if(index >= 0){
      this.groupUsers.splice(index, 1);
    }
  }

  addUserToGroup(user: any) {
    this.groupUsers.push(user);
  }

  onFileSelected($event: Event) {
    // @ts-ignore
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.file = input.files[0];
    } else {
      this.file = null;
    }
  }

  receiveNotifications(notification: NotificationDTO) {
    let user1 = this.users2.find(user => user.user_id == notification.user_id);
    let user2 = this.users.find(user => user.user_id == notification.user_id);
    if(notification.notificationType == 'FRIEND_ACCEPT'){
      this.updateFriendStatus(user1, 'ACCEPTED');
      this.updateFriendStatus(user2, 'ACCEPTED');
    } else if(notification.notificationType == 'FRIEND_REMOVED') {
      this.updateFriendStatus(user1, null);
      this.updateFriendStatus(user2, null);
    } else if (notification.notificationType == 'FRIEND_REQUEST') {
      this.updateFriendStatus(user1, 'TO_ACCEPT');
      this.updateFriendStatus(user2, 'TO_ACCEPT');
    }
  }

  updateFriendStatus = (user: UserDTO2 | undefined, status: string | null) => {
    if(user){
      user.status=status;
    }
  }

}
