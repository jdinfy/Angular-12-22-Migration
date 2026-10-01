import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Tutorial } from 'src/app/models/tutorial.model';
import { TutorialService } from 'src/app/services/tutorial.service';

type SortColumn = 'id' | 'title' | 'description' | 'published';

@Component({
  selector: 'app-tutorials-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tutorials-list.component.html',
  styleUrls: ['./tutorials-list.component.css']
})
export class TutorialsListComponent implements OnInit {
  tutorials: Tutorial[] = [];
  searchTerm = '';
  sortColumn: SortColumn = 'id';
  sortDirection: 'asc' | 'desc' = 'asc';
  currentPage = 1;
  readonly pageSize = 10;
  editingId: number | string | null = null;
  editDraft: Tutorial = {};
  addingTutorial = false;
  addDraft: Tutorial = this.emptyDraft();
  saveError = '';

  constructor(private tutorialService: TutorialService) { }

  get filteredTutorials(): Tutorial[] {
    const query = this.searchTerm.trim().toLocaleLowerCase();
    const rows = this.tutorials.filter(tutorial =>
      [tutorial.id, tutorial.title, tutorial.description, tutorial.published ? 'published' : 'pending']
        .some(value => String(value ?? '').toLocaleLowerCase().includes(query))
    );

    return rows.sort((left, right) => this.compare(left, right));
  }

  get pagedTutorials(): Tutorial[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredTutorials.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredTutorials.length / this.pageSize));
  }

  get firstRecord(): number {
    return this.filteredTutorials.length ? (this.currentPage - 1) * this.pageSize + 1 : 0;
  }

  get lastRecord(): number {
    return Math.min(this.currentPage * this.pageSize, this.filteredTutorials.length);
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, index) => index + 1);
  }

  ngOnInit(): void {
    this.retrieveTutorials();
  }

  retrieveTutorials(): void {
    this.tutorialService.getAll().subscribe(
      data => this.tutorials = data,
      error => console.error('Could not load tutorials:', error)
    );
  }

  removeTutorial(tutorial: Tutorial): void {
    if (tutorial.id === undefined || tutorial.id === null) return;

    this.tutorialService.delete(tutorial.id).subscribe(
      () => this.retrieveTutorials(),
      error => console.error('Could not delete tutorial:', error)
    );
  }

  startAdd(): void {
    this.addingTutorial = true;
    this.editingId = null;
    this.addDraft = this.emptyDraft();
    this.saveError = '';
  }

  cancelAdd(): void {
    this.addingTutorial = false;
    this.addDraft = this.emptyDraft();
    this.saveError = '';
  }

  createTutorial(): void {
    if (!this.addDraft.title?.trim()) {
      this.saveError = 'Enter a tutorial title before saving.';
      return;
    }

    this.tutorialService.create(this.toPayload(this.addDraft)).subscribe(
      () => {
        this.cancelAdd();
        this.retrieveTutorials();
      },
      error => this.saveError = error.message || 'Could not add the tutorial.'
    );
  }

  startEdit(tutorial: Tutorial): void {
    this.editingId = tutorial.id;
    this.addingTutorial = false;
    this.editDraft = { ...tutorial };
    this.saveError = '';
  }

  cancelEdit(): void {
    this.editingId = null;
    this.editDraft = {};
    this.saveError = '';
  }

  saveEdit(): void {
    if (this.editingId === null || !this.editDraft.title?.trim()) {
      this.saveError = 'Enter a tutorial title before saving.';
      return;
    }

    this.tutorialService.update(this.editingId, this.toPayload(this.editDraft)).subscribe(
      () => {
        this.cancelEdit();
        this.retrieveTutorials();
      },
      error => this.saveError = error.message || 'Could not update the tutorial.'
    );
  }

  isEditing(tutorial: Tutorial): boolean {
    return tutorial.id === this.editingId;
  }

  sortBy(column: SortColumn): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
      this.currentPage = 1;
      return;
    }

    this.sortColumn = column;
    this.sortDirection = 'asc';
    this.currentPage = 1;
  }

  onSearchChange(): void {
    this.currentPage = 1;
  }

  goToPage(page: number): void {
    this.currentPage = Math.min(Math.max(page, 1), this.totalPages);
  }

  sortIndicator(column: SortColumn): string {
    if (column !== this.sortColumn) return '↕';
    return this.sortDirection === 'asc' ? '↑' : '↓';
  }

  ariaSort(column: SortColumn): string {
    if (column !== this.sortColumn) return 'none';
    return this.sortDirection === 'asc' ? 'ascending' : 'descending';
  }

  private compare(left: Tutorial, right: Tutorial): number {
    const leftValue = left[this.sortColumn];
    const rightValue = right[this.sortColumn];
    let result: number;

    if (this.sortColumn === 'published') {
      result = Number(Boolean(leftValue)) - Number(Boolean(rightValue));
    } else if (this.sortColumn === 'id' && Number.isFinite(Number(leftValue)) && Number.isFinite(Number(rightValue))) {
      result = Number(leftValue) - Number(rightValue);
    } else {
      result = String(leftValue ?? '').localeCompare(String(rightValue ?? ''), undefined, {
        numeric: true,
        sensitivity: 'base'
      });
    }

    return this.sortDirection === 'asc' ? result : -result;
  }

  private emptyDraft(): Tutorial {
    return { title: '', description: '', published: false };
  }

  private toPayload(tutorial: Tutorial): Tutorial {
    return {
      title: tutorial.title?.trim(),
      description: tutorial.description?.trim(),
      published: Boolean(tutorial.published)
    };
  }
}
