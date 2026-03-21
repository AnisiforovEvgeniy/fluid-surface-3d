import { makeAutoObservable } from "mobx";

const STORAGE_KEY = "formSurfaceSettings";

export class FormSurfaceStore {
  formSurface = 1;

  constructor() {
    makeAutoObservable(this);
  }

  setformSurface = (formSurface) => {
    this.formSurface = formSurface;
  };

  reset = () => {
    this.formSurface = 1;
  };

  toJSON() {
    return {
      formSurface: this.formSurface,
    };
  }
}