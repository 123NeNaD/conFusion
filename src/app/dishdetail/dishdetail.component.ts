import {
  Component,
  OnInit,
  ViewChild,
  Inject /**,Input**/,
} from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { Dish } from "../shared/dish";
import { Params, ActivatedRoute } from "@angular/router";
import { Location } from "@angular/common";
import { DishService } from "../services/dish.service";
import { switchMap } from "rxjs/operators";
import { Comment } from "../shared/comment";
import { visibility, flyInOut, expand } from "../animations/app.animation";

@Component({
  selector: "app-dishdetail",
  templateUrl: "./dishdetail.component.html",
  styleUrls: ["./dishdetail.component.scss"],
  host: {
    "[@flyInOut]": "true",
    style: "display: block;",
  },
  animations: [visibility(), flyInOut(), expand()],
})
export class DishdetailComponent implements OnInit {
  commentForm: FormGroup;
  comment: Comment;
  date: string;
  @ViewChild("fform") commentFormDirective;

  formErrors = {
    author: "",
    comment: "",
  };

  validationMessages = {
    author: {
      required: "Name is required.",
      minlength: "Name must be at least 2 characters long.",
    },
    comment: {
      required: "Comment is required.",
    },
  };

  /** @Input() dish: Dish; **/

  dish: Dish;
  errMess: string;
  dishIds: string[];
  prev: string;
  next: string;
  dishcopy: Dish;
  visibility = "shown";

  constructor(
    private dishService: DishService,
    private route: ActivatedRoute,
    private location: Location,
    private fb: FormBuilder,
    @Inject("BaseURL") private BaseURL
  ) {
    this.createForm();
  }

  createForm() {
    this.commentForm = this.fb.group({
      author: ["", [Validators.required, Validators.minLength(2)]],
      rating: 5,
      comment: ["", Validators.required],
    });

    this.commentForm.valueChanges.subscribe((data) =>
      this.onValueChanged(data)
    );

    this.onValueChanged(); // (re)set form validation messages
  }

  onValueChanged(data?: any) {
    if (!this.commentForm) {
      return;
    }
    const form = this.commentForm;
    for (const field in this.formErrors) {
      if (this.formErrors.hasOwnProperty(field)) {
        // clear previous error message (if any)
        this.formErrors[field] = "";
        const control = form.get(field);
        if (control && control.dirty && !control.valid) {
          const messages = this.validationMessages[field];
          for (const key in control.errors) {
            if (control.errors.hasOwnProperty(key)) {
              this.formErrors[field] += messages[key] + " ";
            }
          }
        }
      }
    }
  }

  ngOnInit() {
    this.dishService
      .getDishIds()
      .subscribe((dishIds) => (this.dishIds = dishIds));
    this.route.params
      .pipe(
        switchMap((params: Params) => {
          this.visibility = "hidden";
          return this.dishService.getDish(params["id"]);
        })
      )
      .subscribe(
        (dish) => {
          this.dish = dish;
          this.dishcopy = dish;
          this.setPrevNext(dish.id);
          this.visibility = "shown";
        },
        (errmess) => (this.errMess = <any>errmess)
      );
  }

  setPrevNext(dishId: string) {
    let index = this.dishIds.indexOf(dishId);
    this.prev = this.dishIds[
      (this.dishIds.length + index - 1) % this.dishIds.length
    ];
    this.next = this.dishIds[
      (this.dishIds.length + index + 1) % this.dishIds.length
    ];
  }

  goBack(): void {
    this.location.back();
  }

  onSubmit() {
    this.date = new Date().toISOString();
    this.comment = {
      author: this.commentForm.get("author").value,
      rating: this.commentForm.get("rating").value,
      comment: this.commentForm.get("comment").value,
      date: this.date,
    };
    console.log(this.comment);
    this.commentFormDirective.resetForm();
    this.commentForm.reset({
      author: "",
      rating: 5,
      comment: "",
    });

    this.dishcopy["comments"].push(this.comment);
    this.dishService.putDish(this.dishcopy).subscribe(
      (dish) => {
        this.dish = dish;
        this.dishcopy = dish;
      },
      (errmess) => {
        this.dish = null;
        this.dishcopy = null;
        this.errMess = <any>errmess;
      }
    );

    this.date = "";
  }
}
