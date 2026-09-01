---
title: "Heron's approach to reflection"
description: 'A look at how Heron handles code generation and reflection'
pubDate: 2026-09-01
tags:
- 'nerd'
- 'programming'
- 'heron'
- 'compilers'
---

I have been working on a statically typed, memory-safe programming language
called Heron.  While going through many, many, *many* stages of iteration of
the language's design, I finally landed on a reflection system I am happy with.

First though, I should set in stone what I think reflection is and what it
allows you to do.  Reflection, in my opinion, is a language feature that allows
the program to perform introspection as well as arbitrary code generation.  Note
that none of this relies on external tooling, such as Python scripts or other
programs like [moc](https://doc.qt.io/qt-6/moc.html).

Reflection and how it should be done have been – like programmers normally love
to do – widely debated in how they should be implemented in programming
languages.  Some do it in a very primitive manner, bolting it onto the language
through many functions with different names, others create entire DSLs on top.
I wanted to avoid that and make the system as simple but as powerful as
possible.  Easy right? Well...

# The Approaches

There are many approaches you could take while designing such a system.  Let's
split the reflection into its two parts: the introspection and the code
generation.

For introspection there are a couple of approaches that we can take:

## Specialized functions

This is the easiest but most verbose option – both in implementation and usage.
This approach relies on making various functions that only do one specialized
thing on some value representing the code.  Those functions are usually
implemented as compiler/interpreter built-ins, and as a result, you end up with
a huge compiler that contains a lot of boilerplate.

For example, let's say we want to iterate over all the fields of a structure and
print the names of its members. In C++26, that would look something like this:

```cpp
struct GameState {
    float paddle_y[2];
    int button_state;
};

template<typename T>
void dump(T const &obj)
{
    template for (constexpr auto member :
        std::meta::nonstatic_data_members_of(
            ^^T,
            std::meta::access_context::current()))
    {
        std::cout << std::meta::identifier_of(member) << '\n';
    }
}

int main() {
    GameState s { {2.0f, 4.0f}, 0b1101 };
    dump(s);
}
```

We can already see the problem with this approach – it is extremely explicit!
This introduces a whole bunch of functions, like `nonstatic_data_members_of` and
[others](https://cppreference.com/cpp/meta/reflection).  This bloats up the meta
namespace, which makes finding the right function hard, especially in
autocomplete (look at the `is_` functions!), and the function names are also
very explicit making the code harder to parse.

## Macros

Macros are able to help with this issue, but are much more limited.  The usual
approach is to create two files: one with the actual code, and one with the
member definitions. So, you end up with something like this:

```cpp
// members.def
X(float, paddle_y, [2];)
X(int, button_state, ;)

// main.cpp
#define X(type, name, type_post) type name type_post
struct GameState {
#include "members.def"
};
#undef X

#define X(type, name, type_post) std::cout << #name << '\n';
void dump(GameState const &t) {
#include "members.def"
}
#undef X

int main() {
    GameState s { {2.0f, 4.0f}, 0b1101 };
    dump(s);
}
```

We can already see the first limitation of this approach.  Firstly, `dump` is no
longer templated, so it will only work with `GameState`.  If we wish to make
`dump` work with other types, we need to create overloads, which leads to code
duplication.  Secondly, all our member definitions *have* to live in another
file if we do not want to repeat ourselves.  Not only that, we also have to
define the actual code to be generated.

## AST data structure

All of this leads to my choice for introspection – an AST data structure in the
standard library.  This may seem a bit of a weird choice at first, since you are
exposing compiler internals, right?

Nope!  The AST can be completely independent from the compiler's representation.
You can define a generic, detailed AST that covers pretty much every primary
aspect of the language and have the compiler transform its own representation to
it.  This is basically what I went for in my language.  So, the code turns out
something like this:

```
GameState :: struct {
  paddle_y: [2]f32;
  button_state: int
};

dump :: fn(ty: type) {
  tree := @get_ast(ty);
  match declaration in tree {
    case rf.Declaration -> match type_decl in declaration.children[0] {
      case rf.TypeDeclaration -> match fields in type_decl.children[0] {
        case rf.Block -> for child in fields.children {
          match field in child {
            case rf.Declaration -> if !field.comptime do {
              fmt.println("{}", field.name);
            }
          }
        }
      }
    }
  }
};

main :: fn do dump(GameState);
```

Notice that tree is just an AST node.  This means we can now simply get its
declarations and print them normally.  Yes it's a bit more explicit than I would
like it to be, but the language is still WIP, so there are some missing things
(like we shouldn't require a whole match block just for one case!).  But you can
see how, by using existing language features, this code becomes much easier to
parse, without having to bloat up the namespace, as you only get what you need
because of the AST node fields.  This could probably be even more simplified if
I make the AST node members not point back to the `AST` where applicable, but
instead dedicated types.

# Code generation

OK, so we got introspection, what about generating code?  We already saw a bit
of that when doing introspection with macros, but there are a few other options
as well:

## Specialized functions

The first obvious one is, again, specialized functions.  Have a function to
generate whatever.  This has the same issues as with introspection, lots of
boilerplate, and hard and clunky to use.  This is what I initially thought for
heron, have a bunch of functions or maybe a builder-style API to generate code.
When it became time to actually think about reflection properly, I realised the
immense effort of implementing this approach, so I didn't take it.

## Token streams

One of the first places I saw this approach was in HolyC of all places.
Basically, the language has a special compiler directive that's called `#exe`,
which runs code at compilation time.  This can be used to insert into the token
stream of the compiler strings and achieve code generation that way.  For
example, you can generate a whole bunch of definitions like this:

```holyc
#exe {
	I64 i = 0;
	for (i = 0; i < 10; i++)
		StreamPrint("#define VALUE_%d (%d)\n", i, i++);
};
```

While this is quite powerful, it can also introduce a bunch of mistakes.  What
happens if you create a syntax error by accident?  Now you have to go, find the
code that generates the string and fix it (if you can even find the source of
the bad part of the string, that is).  This, in my opinion, in the long-term,
leads to bad ergonomics.

## Getting lispy with quotes

Lisp, however, has a very nice approach – quotes.  For example, you can have a
little function that generates a bit of quote to increase the value of a
variable:

```
(defmacro inc (place)
  `(setq ,place (+ ,place 1)))

(inc some_counter)
```

Here you can see what it does, the `,id` basically inserts whatever that value
is literally in place, so what that call to `inc` becomes is essentially this:

```
(setq some_counter (+ some_counter 1))
```

A similar approach can be taken with other programming languages. For example in
heron, if we want to have a similar `inc` function:

```
inc :: fn(place: code) -> code do '{
  ,{place} = ,{place} + 1
};

main := fn {
  mut some_counter := 0;
  @insert(inc('{ some_counter }));
};
```

Notice that we have a function that takes in code and returns other code. Code
is a first class citizen in Heron, and is treated almost like every other type.

My language also introduces `,@{}` and `@emit`, which can be used to run code
that emits other code. For example:

```
use core.fmt;

make_prints :: fn -> code {
  return '{
     ,@{
        for i in 1..<4 {
           @emit('{
              fmt.println("{}", ,{i});
           })
        }
     }
  }
};

main := fn {
  @insert(make_prints())
};
```

Which essentially makes `main` turn into:

```
main := fn {
  fmt.println("{}", 1);
  fmt.println("{}", 2);
  fmt.println("{}", 3);
};
```

# Conclusion

All in all, the approach I settled on is surprisingly simple: use a regular AST
data structure for introspection and make code a first-class citizen for
generation.

I especially like that with this approach, ***everything doesn't feel like it's a
whole separate thing embedded into Heron and that it's actually part of the
language – which it is***.  There's no huge list of compiler intrinsics to learn,
no external preprocessing to be done and none of it is stringly typed.  Most of
this is already expressed with features Heron already has, things like structs,
typed unions, functions and basic control flow.  While the compiler does have to
provide *some* intrinsics like `@get_ast` or `@emit`, they are far fewer in
number than an approach based on specialized functions.

There are still lots of quirks to figure out, better ergonomics, how diagnostics
should work so that they are nice and readable, but this design remains, in my
opinion, a very, *very* solid foundation for what's to come in future revisions
of the language.  After all of this, I will probably be able to just stop
redesigning the reflection system from scratch for months.

Probably.

