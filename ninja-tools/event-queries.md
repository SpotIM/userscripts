![Spot.IM Ninja Tools Logo](./header.png)

## Event Queries

```
type:loaded
```

Only show events where **type** _is_ **loaded**

```
loaded
```

Also, only show events where **type** _is_ **loaded** (type is a special prop, you don't need to specify it)

```
source:conversation
```

Only show events where **source** _is_ **conversation**

### Wildcards

```
message_id:sp*
```

Only show events where **message_id** _starts with_ **sp**

```
message_id:*Bv47Tp
```

Only show events where **message_id** _ends with_ **Bv47Tp**

```
message_id:*p0st1*
```

Only show events where **message_id** _includes_ **p0st1**

### Negation

```
-type:loaded
```

Show all events _except_ ones where **type** _is_ **loaded**

### Multiple Rules

```
type:loaded source:conversation
```

Only show events where **type** is **loaded** _and_ **source** is **conversation**

### Explicitly Show Prop

```
native!
```

Show **native** prop for all events

```
native! target_id!
```

Show **native** and **target_id** props for all events
