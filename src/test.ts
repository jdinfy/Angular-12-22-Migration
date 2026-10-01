import { getTestBed } from '@angular/core/testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting
} from '@angular/platform-browser-dynamic/testing';

import './app/app.component.spec';
import './app/models/tutorial.model.spec';
import './app/services/tutorial.service.spec';
import './app/components/add-tutorial/add-tutorial.component.spec';
import './app/components/tutorial-details/tutorial-details.component.spec';
import './app/components/tutorials-list/tutorials-list.component.spec';

// First, initialize the Angular testing environment.
getTestBed().initTestEnvironment(
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting()
);
