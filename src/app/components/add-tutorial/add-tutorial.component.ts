import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Tutorial } from 'src/app/models/tutorial.model';
import { TutorialService } from 'src/app/services/tutorial.service';

@Component({
  selector: 'app-add-tutorial',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-tutorial.component.html',
  styleUrls: ['./add-tutorial.component.css']
})
export class AddTutorialComponent implements OnInit {

  tutorial: Tutorial = {
    title: '',
    description: '',
    published: false
  };
  submitted = false;
  errorMessage = '';

  constructor(private tutorialService: TutorialService) { }

  ngOnInit(): void {
  }

  saveTutorial(): void {
    this.errorMessage = '';

    if (!this.tutorial.title?.trim()) {
      this.errorMessage = 'Enter a tutorial title before saving.';
      return;
    }

    const data = {
      title: this.tutorial.title.trim(),
      description: this.tutorial.description?.trim() || '',
      published: Boolean(this.tutorial.published)
    };

    this.tutorialService.create(data)
      .subscribe(
        response => {
          this.submitted = true;
        },
        error => {
          this.errorMessage = error.message || 'Could not add the tutorial.';
        });
  }

  newTutorial(): void {
    this.submitted = false;
    this.errorMessage = '';
    this.tutorial = {
      title: '',
      description: '',
      published: false
    };
  }

}
