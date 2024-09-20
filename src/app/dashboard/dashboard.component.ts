import {Component, ElementRef, EventEmitter, Input, OnInit, Output, signal, ViewChild} from '@angular/core';
import {MenuComponent} from "../menu/menu.component";
import {Router, RouterOutlet} from "@angular/router";
import {Chart, registerables} from "chart.js";
import {InterestsService} from "../domains/interests/interests.service";
import {IInterest, IInterestStats} from "../domains/interests/interests.types";
import {CommonModule} from "@angular/common";
import {UserService} from "../domains/user/user.service";
import {FriendsOnline, UserDTO, UserDTO4} from "../domains/user/user.types";
import {DateTimePipe} from "../pipe/date-time.pipe";
import {FriendsService} from "../domains/friends/friends.service";
import {FormsModule} from "@angular/forms";

declare var google: any;
Chart.register(...registerables)

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    MenuComponent,
    RouterOutlet,
    CommonModule,
    FormsModule,
    DateTimePipe
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {

  @Output() messageEvent = new EventEmitter<string>();

  @ViewChild('myChart2') private chartRef2!: ElementRef;
  @ViewChild('onlineFriendss', { static: true }) onlineFriendss!: ElementRef;

  file: File | null = null;

  newUsers: boolean = true;
  mutualFriends: UserDTO4[] = [];
  newUser: UserDTO4[] = [];
  datesTest: string[] = [];

  users5: number[] = [];
  endDate = new Date();
  startDate = new Date();

  money: number[] = [];

  interests: IInterest[] = [];
  interestAdd: string="";
  personalData!: UserDTO;
  userInterests: IInterestStats[]=[];
  friendsOnline: FriendsOnline= { onlineFriends: 0, friends: 0 };
  @Input() bgColor: string='';
  currentIndex: number = 0;
  visibleItemsCount: number = 4;

  constructor(private interestsService: InterestsService, private userService: UserService, private friendsService: FriendsService, private router: Router) {
  }

  ngOnInit(): void {
    this.endDate.setFullYear(this.startDate.getFullYear()-1);
    this.endDate.setMonth(this.startDate.getMonth() + 1);
    this.endDate.setDate(1);
    this.userService.getImage().subscribe((data: any) => {
      this.userService.getUserPhoto(data.id).subscribe((data: any) => {
        this.setProfilePicture("profilePicture", data);
      });
    });
    this.interestsService.getInterests().subscribe((data: any) => {
      this.interests = data;
    });
    this.userService.getPersonalData().subscribe((data: any) => {
      this.personalData = data;
    });
    this.userService.getActiveFriendsCount().subscribe((data: any) => {
      this.friendsOnline = data;
      this.onlineFriendss.nativeElement.style.setProperty('--value', (this.friendsOnline.onlineFriends/this.friendsOnline.friends)*100 );
    });
    this.userService.getNewUsers().subscribe((data: any) => {
      this.newUser = data;
      this.newUser.forEach(friend => {
        this.userService.getUserPhoto(friend.id.toString()).subscribe((data: any) => {
          this.setProfilePicture(friend.id.toString(), data);
        });
      })
    });
    this.userService.getMutualFriendsUsers().subscribe((data: any) => {
      this.mutualFriends = data;
      this.mutualFriends.forEach(friend => {
        this.userService.getUserPhoto(friend.id.toString()).subscribe((data: any) => {
          this.setProfilePicture(friend.id.toString(), data);
        });
      })
    });
    this.interestsService.getFriendsInterests().subscribe((data: any) => {
      this.userInterests = data;
      this.userInterests = this.userInterests.sort((n1,n2) => n2.percentage - n1.percentage);
    });
    this.userService.getImage().subscribe((data: any) => {
      this.bgColor = data.bgColor;
    });
    this.userService.getFriendsCountries().subscribe((data: any) => {
      this.createMap(data.map((country: any) => {return [country.country, country.count]}));
    });
    this.getMonths();
    this.createIncomeChart();
  }

  createIncomeChart() {
    this.userService.getSentMessagesByTime().subscribe((data: any) => {
      data.forEach((dat:any) => {
          this.addAmountToMonth(dat, this.users5);
      });

      const myChart = new Chart(this.chartRef2.nativeElement, {
          type: 'bar',
          data: {
            labels: this.datesTest,
            datasets: [{
              data: this.users5,
              backgroundColor: 'rgb(27,48,98)',
            }]
          },
          options: {
            plugins: {
              legend: {
                display: false
              },
              title: {
                display: false,
                text: ''
              },
            },
            responsive: true,
            scales: {
              x: {
                grid: {
                  display: false
                },
                stacked: false,
              },
              y: {
                grid: {
                  display: false
                },
                display: false,
                ticks: {
                  stepSize: 1
                },
                stacked: false
              }
            }
          }
        }
      );
    });
  }

  addInterest(){
    this.interestsService.addInterest({value: this.interestAdd}).subscribe((data: any) => {
      this.interests.push({ id: data, value: this.interestAdd});
      this.interestAdd="";
    });
  }

  deleteInterest(id: number){
    this.interestsService.deleteInterest(id).subscribe((data: any) => {
      this.interests.splice(this.interests.findIndex(interest => interest.id == id), 1);
    });
  }

  getMonth(date: Date): string {
    const monthNames = [
      "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
      "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"
    ];

    return monthNames[date.getMonth()];
  }

  addAmountToMonth(data: { amount: number, date: string }, list: number[]): void {
    const dateObj = new Date(data.date);
    const monthYear = this.getMonth(dateObj);
    const index = this.datesTest.indexOf(monthYear);
    if (index !== -1) {
      list[index] += data.amount;
    } else {
      console.error(`Month ${monthYear} not found in dates2 array.`);
    }
  }

  acceptFriendRequest(userId: number){
    this.friendsService.acceptFriendRequest(userId).subscribe((data: any) => {
      let find = this.newUser.find(user => user.id == userId);
      if (find) {
        find.friendStatus = 'ACCEPTED';
      }
      let find2 = this.mutualFriends.find(user => user.id == userId);
      if (find2) {
        find2.friendStatus = 'ACCEPTED';
      }
    });
  }

  createFriendRequest(userId: number){
    this.friendsService.createFriendRequest(userId).subscribe((data: any) => {
      let find = this.newUser.find(user => user.id == userId);
      if (find) {
        find.friendStatus = 'PENDING';
      }
      let find2 = this.mutualFriends.find(user => user.id == userId);
      if (find2) {
        find2.friendStatus = 'PENDING';
      }
    });
  }

  getMonths(){
    const monthNames = [
      "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
      "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"
    ];
    this.users5=[];
    this.money=[];
    this.datesTest=[];
    let actualDate = new Date();
    let endDate = new Date();
    endDate.setDate(1);
    endDate.setFullYear(endDate.getFullYear() - 1);
    endDate.setMonth(endDate.getMonth() + 1);
    while (endDate <= actualDate) {
      this.datesTest.push(monthNames[endDate.getMonth()]);
      endDate.setMonth(endDate.getMonth() + 1);
      this.users5.push(0);
      this.money.push(0);
    }
  }

  prev() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
    }
  }

  next() {
    if (this.currentIndex < 6 - this.visibleItemsCount) {
      this.currentIndex++;
    }
  }

  createMap(data: [string, number][] = []) {
    google.charts.load('current', {
      'packages': ['geochart'],
    });

    google.charts.setOnLoadCallback(drawRegionsMap);

    const finalData: ([string, number] | [string, string])[] = [["Country", 'Friends'], ...data];

    function drawRegionsMap() {
      var data = google.visualization.arrayToDataTable(finalData);
      var options = {
        colors: ['#eff3f6', '#2E78F3'],
        backgroundColor: '#eff3f6',
        datalessRegionColor: '#f7f7f7',
        stroke: 'transparent',
        border: 'none',
        legend: 'none'
      };
      var chart = new google.visualization.GeoChart(document.getElementById('regions_div'));

      chart.draw(data, options);
    }

  }

  changeColor(color: string) {
    this.userService.changeColor(color).subscribe((data: any) => {
      this.bgColor = color;
      this.messageEvent.emit(color);
    });
  }

  onFileSelected($event: Event) {
    // @ts-ignore
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.file = input.files[0];
      this.userService.updateUserPhoto(this.file).subscribe((data: any) => {
        this.userService.getUserPhoto(this.personalData.id).subscribe((data: any) => {

        });
      });
    } else {
      this.file = null;
    }
  }

  logout() {
    document.cookie="";
    this.router.navigate(['/sign-in']).then(() => window.location.reload());
  }

  logoutAll() {
    document.cookie="";
    this.router.navigate(['/sign-in']).then(() => window.location.reload());
  }

  setProfilePicture(userId: string, imageData: ArrayBuffer): void {
    const blob = new Blob([imageData], { type: 'image/png' });
    let element = (<HTMLInputElement> document.getElementById(userId.toString()));
    element.src = URL.createObjectURL(blob);
  }
}
