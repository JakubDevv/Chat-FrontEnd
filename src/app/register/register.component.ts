import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule} from "@angular/forms";
import {Router, RouterLink} from "@angular/router";
import {AuthService} from "../domains/auth/auth.service";
import {NgIf} from "@angular/common";

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    NgIf,
    FormsModule
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent implements OnInit {

  file: File | null = null;

  form!: FormGroup;

  constructor(private formBuilder: FormBuilder, private router: Router, private authService: AuthService) { }

  ngOnInit(): void {
    document.cookie = "";
    this.form = this.formBuilder.group({
      userName: '',
      firstName: '',
      lastName: '',
      password:'',
      country: '',
      city: ''
    })
  }

  submit(){
    this.authService.register(this.form).subscribe((data: any)=>{
      document.cookie = data.refreshToken;
      this.router.navigate(['/']).then(() => window.location.reload());
      this.authService.setUserPhoto(data.id, this.file as File).subscribe(()=> {});
    });
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

}
