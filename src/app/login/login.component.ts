import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule} from "@angular/forms";
import {Router, RouterLink} from "@angular/router";
import {AuthService} from "../domains/auth/auth.service";

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    RouterLink,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {

  form!: FormGroup;
  constructor(private formBuilder: FormBuilder, private router: Router, private service: AuthService) { }

  ngOnInit(): void {
    document.cookie = "";
    this.form = this.formBuilder.group({
      username: '',
      password:''
    });
  }

  submit(){
    this.service.login(this.form).subscribe((data: any)=>{
      this.router.navigate(['/dashboard']).then(() => window.location.reload());
      document.cookie = `${data.refreshToken}; path=/`;
    });
  }
}
