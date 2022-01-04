# Mock Functions Codealong

## Learning Goals

- Understand the problem solved by mocking functions
- Define a mock function
- Implement a mock function in Jest
- Reset a mock function after a test

## Introduction

Let's take a closer look at the functions we tested in the previous lessons:

```js
export function pointsForWord(word) {
  let points = 0;
  for (const char of word) {
    points += /[aeiou]/i.test(char) ? 1 : 2;
  }
  return points;
}

export function isPalindrome(word) {
  return word === word.split("").reverse().join("");
}
```

These functions share a few key traits that make them relatively simple to test.
They are both **pure functions**, meaning that they:

- Always produce the same return value when given the same input (calling
  `pointsForWord("test")` will always return `7`)
- Have no _side effects_ (they don't alter any external state)

In your code, you should strive for writing pure functions as much as possible,
since they make your code more predictable and easy to test. One of the benefits
of following test-driven development is it forces you to consider whether or not
a function is pure, and helps to steer your application design to use more pure
functions.

However, it's not possible to use pure functions for every piece of code you
write. Consider building following feature:

We're making a turn-based game, and we want a way to randomly determine which
player goes first by flipping a coin.

Since we need an element of "randomness" in our function, it _can't_ be a pure
function. We need a function that we can call and generate a different result
each time it is called. This is an example of a [nondeterministic function][]: a
function that, even given the same input, can have different return values each
time it is called.

Let's see how this function might look in code:

```js
function coinFlip() {
  return Math.random() > 0.5;
}
```

The [`random()`][random] method is available on the global `Math` object, and it
returns a random number between 0 and 1.

The challenges to testing a function like this are:

- We have a nondeterministic function, and we want to make it deterministic — we
  want to be able to confidently say that calling the function will always
  return the same output under the same set of conditions
- Our function has an _external dependency_: it depends on code that we don't
  have control over, namely the `Math.random()` method.

So how can we test it? With mocks!

## What Is a Mock?

In testing, the word "mock" is used to describe a test double that stands in for
the actual implementation of a function. Mocks are like the stunt doubles of the
testing world. When we don't want to use the actual actor (function) in a scene
(test), we can put in the stunt double (mock) in their place!

A mock doesn't need to be able to perform all the same duties as the original
function; what's important is that it has the same _interface_ (it can be called
with the same arguments and returns the right data). Mocks give us a way to
change a part of our application's behavior just for the sake of testing.

Mocks help with the problem at hand by giving us a way to replace a dependency
that we don't control (`Math.random()`) with a new function that we do control.

## Using Mocks In Jest

Now that we understand the purpose of mocks, let's see how to use them in Jest.

Fork and clone this lesson and run `npm install`. Take a look at the code in the
`src` directory. We've got a test set up for our `coinFlip` function where we
expect it to return `true`:

```js
describe("coinFlip", () => {
  it("returns false when the random value is less than or equal to 0.5", () => {
    expect(coinFlip()).toBe(false);
  });
});
```

Run `npm test`. Your test may or may not pass, depending on what `Math.random()`
returns at the time your test is run! Running the test several more times will
produce a different result (you can press the `a` key in the terminal to run the
tests again in watch mode). Our test gives us no confidence that our code is
functioning as expected.

We can fix the behavior by mocking the actual implementation of the
`Math.random` function and ensuring that it returns a predictable value when our
tests are run:

```js
describe("coinFlip", () => {
  it("returns false when the random value is less than or equal to 0.5", () => {
    Math.random = jest.fn(() => 0);

    expect(coinFlip()).toBe(false);
  });
});
```

Since `Math` is a global object, we can reference it both in our test file as
well as in the `utils.js` file. Here, we're _changing its behavior_ before the
`coinFlip` function uses it:

```js
Math.random = jest.fn(() => 0);
```

This line creates a new mock function implementation using the
[`jest.fn()`][jest-fn] method, and sets the return value to always be `0`. Now,
anytime `Math.random()` is used, our new mock function will be used instead.
We've made our code deterministic and predictable!

Mock functions in Jest also have a few tricks up their sleeve. We can check
whether or not the mocked function was called:

```js
it("returns false when the random value is less than or equal to 0.5", () => {
  Math.random = jest.fn(() => 0);

  expect(coinFlip()).toBe(false);
  expect(Math.random).toHaveBeenCalled();
});
```

Using a mock this way is an example of "spying" on a function to see how it was
used. Check out the [Mock Functions page][mocks] in the Jest API docs for more.

> **Note**: In our case, testing whether or not `Math.random` was called isn't
> particularly useful: our function only needs to return true or false, and our
> tests shouldn't care about the implementation details of the function.
> However, being able to spy on a function and see how it was called, and what
> values were passed in, is useful in other scenarios, like checking the console
> output when building a CLI application.

We can also change the mock function for different test cases:

```js
it("returns false when the random value is less than or equal to 0.5", () => {
  Math.random = jest.fn(() => 0);

  expect(coinFlip()).toBe(false);
});
it("returns true when the random value is greater than 0.5", () => {
  Math.random = jest.fn(() => 1);

  expect(coinFlip()).toBe(true);
});
```

Now we can confidently say that our `coinFlip` function behaves as expected.

## Resetting the World

One rule of tests is that they should _always run in isolation_: running one
test shouldn't have an impact on other tests. So an important element of writing
tests is making sure to reset the state of the application once your test is
done.

An issue with our current approach is that we've overridden the functionality of
`Math.random` not just in our test file, but in _every_ piece of our application
that runs after this test runs. In the last test in our test file, we set
`Math.random` to always return `0`.

Let's see this in action:

```js
describe("coinFlip", () => {
  it("returns false when the random value is less than or equal to 0.5", () => {
    Math.random = jest.fn(() => 0);

    expect(coinFlip()).toBe(false);
  });
  it("returns true when the random value is greater than 0.5", () => {
    Math.random = jest.fn(() => 1);

    expect(coinFlip()).toBe(true);
  });
});

describe("a new feature", () => {
  it("uses the original implementation of Math.random", () => {
    expect(Math.random()).not.toBe(1);
  });
});
```

Jest has a few [setup and teardown][setup-teardown] functions that will help
with just that. Our goal is to reset the `Math.random()` method back to its
original implementation after our `coinFlip` tests are done. Here's one way we
can do that:

```js
// save a reference to the original Math.random before running tests
const originalRandom = Math.random;

describe("coinFlip", () => {
  // add this function
  afterAll(() => {
    Math.random = originalRandom;
  });

  it("returns false when the random value is less than or equal to 0.5", () => {
    Math.random = jest.fn(() => 0);

    expect(coinFlip()).toBe(false);
  });
  it("returns true when the random value is greater than 0.5", () => {
    Math.random = jest.fn(() => 1);

    expect(coinFlip()).toBe(true);
  });
});

describe("a new feature", () => {
  it("uses the original implementation of Math.random", () => {
    expect(Math.random()).not.toBe(1);
    expect(Math.random).toBe(originalRandom);
  });
});
```

First, we need to save a reference to the original `Math.random` to a new
variable, since we'll be overwriting the implementation in our tests.

Jest will run the callback we pass to the `afterAll` function after _all_ the
tests in the `describe` function have finished, so we know that `Math.random`
will only be mocked in the first `describe` block. After that, we restore it to
the original implementation by using our saved reference.

> There are a number of these [setup and teardown][setup-teardown] functions
> that are useful in different scenarios, such as setting up some data to use in
> a test `beforeEach` test is run. Check out the docs for more examples!

## When to Use Mocks

Mocks are a useful tool in testing, but they should be used with care. Mocks can
make it more difficult to test your application in a realistic way without
recreating all of the behavior of the functions you're mocking. Having an
over-reliance on mocking in your tests may mean that your code has too many
dependencies, and could benefit from refactoring to make the code more
unit-testable. Here are a few scenarios when mocking is useful:

- For non-deterministic functions (as we saw in the example above)
- For code that relies on external services, like network requests

## Conclusion

Mocks are a way to change the behavior of your application for the purposes of
testing. Mocks are useful because they give us control over how certain parts of
the application are used during testing, which makes our tests more predictable.
When working with mocks that change the global state, it's important to clean up
after your tests by resetting the original function.

## Resources

- [Jest Docs: Mock Functions](https://jestjs.io/docs/mock-functions)

[nondeterministic function]:
  https://en.wikipedia.org/wiki/Nondeterministic_algorithm
[random]:
  https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
[jest-fn]: https://jestjs.io/docs/jest-object#jestfnimplementation
[mocks]: https://jestjs.io/docs/mock-function-api
[setup-teardown]: https://jestjs.io/docs/setup-teardown
