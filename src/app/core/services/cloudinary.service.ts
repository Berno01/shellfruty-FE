import { Injectable, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable, map } from "rxjs";
import { environment } from "../../../environments/environment";

interface CloudinaryUploadResponse {
  secure_url?: string;
  url?: string;
  public_id?: string;
}

@Injectable({
  providedIn: "root",
})
export class CloudinaryService {
  private http = inject(HttpClient);
  private readonly cloudName = environment.cloudinary?.cloudName;
  private readonly uploadPreset = environment.cloudinary?.uploadPreset;

  uploadImage(file: File): Observable<string> {
    if (!this.cloudName || !this.uploadPreset) {
      throw new Error("Cloudinary configuration is missing");
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", this.uploadPreset);

    const endpoint = `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`;
    return this.http
      .post<CloudinaryUploadResponse>(endpoint, formData)
      .pipe(map((response) => response.secure_url || response.url || ""));
  }
}
