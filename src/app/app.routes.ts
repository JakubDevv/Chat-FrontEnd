import { Routes } from '@angular/router';
import {ChatComponent} from "./chat/chat.component";
import {DashboardComponent} from "./dashboard/dashboard.component";
import {AddComponent} from "./add/add.component";
import {LoginComponent} from "./login/login.component";
import {RegisterComponent} from "./register/register.component";
import {authGuardGuard} from "./guard/auth-guard.guard";

export const routes: Routes = [
  { path: 'chat', component: ChatComponent, canActivate:[authGuardGuard]},
  { path: 'dashboard', component: DashboardComponent, canActivate:[authGuardGuard]},
  { path: 'friends', component: AddComponent, canActivate:[authGuardGuard]},
  { path: 'sign-in', component: LoginComponent },
  { path: 'sign-up', component: RegisterComponent },
];
