# `cucumber-ts`

Type-safe re-implementation of core functions from the [@cucumber/cucumber]() package.

## How to Use

`cucumber-ts` aims to knit a strict correlation between a step's description string, it's defined parameters and a precise type definition for each one of them. Changing any of these, should trigger a compilation error for the user.

### The different parameter types

```gherkin
Given A customer selects option1

Given A customer picks option1 for purchase
Given A customer picks option1, option2 for purchase
Given A customer picks  for purchase

Given A customer selects the following items: option1
Given A customer selects the following items: option1, option2

Given A customer inputs Jorge as their name
```

```ts
import {
  defineStep,
  parameterTypeList,
  parameterTypeNonEmptyList,
  parameterTypeRaw,
  parameterTypeSum,
  parameterTypeString,
} from "cucumber-ts";

defineStep(
  "A customer selects {var1}",
  (var1) => {
    switch (var1) {
      case "option1":
      case "option2":
        console.log("success", var1);
        break;
      default:
        // Unreachable code.
        break;
    }
  },
  {
    var1: parameterTypeSum("option1", "option2"),
  }
);

defineStep(
  "A customer picks {list1} for purchase",
  (list1) => {
    list1.map((x) => console.log(x));
  },
  {
    list1: parameterTypeList("option1", "option2"),
  }
);

defineStep(
  "A customer selects the following items: {nonEmptyList1}",
  (nonEmptyList1) => {
    nonEmptyList1.map((x) => console.log(x));
  },
  {
    nonEmptyList1: parameterTypeNonEmptyList("option1", "option2"),
  }
);

defineStep(
  "A customer inputs {string1} as their name",
  (string1) => {
    console.log(string1);
  },
  {
    string1: parameterTypeString(),
  }
);
```

---

### A more complete use case

```gherkin
Given A student Pedro Sánchez is attending courses on Algebra, History at University of Oxford
```

```ts
import * as Cucumber from "cucumber-ts";

const subjects = [
  "University of Oxford",
  "Imperial College London",
  "University of St Andrews",
] as const;
type Subject = typeof subjects[number];
const universities = ["Algebra", "Phylosophy", "History"] as const;
type University = typeof universities[number];

Cucumber.defineStep(
  "A student {word} is attending courses on {subject} at {unviversity}",
  (name, subject, university) => {
    const name_: string = name;
    const subject_: Subject = subject;
    const university_: University = university;
  },
  {
    subject: Cucumber.parameterTypeSum(...subjects),
    subject: Cucumber.parameterTypeNonEmptyList(...universities),
  }
);
```

## Contribute

[Suggestions](https://github.com/marcotoniut/cucumber-ts/issues) and contributions are very much welcomed. Special use cases not fully covered by the current api would be most valuable.
