# API

Note: `error` is the error message returned by MySQL.

---

```
GET /user/login/email/<email>
```

### Description

Checks if `<email>` is already registered.

### Response

| Status Code | Response | Description                           |
| ----------- | -------- | ------------------------------------- |
| 200         | "YES"    | `<email>` is already in the database. |
| 404         | "NO"     | `<email>` is not in the database.     |
| 500         | `error`  | Internal Server Error                 |

---

```
POST /user/signup/email/<email>/nickname/<nickname>/school/<school>
```

### Description

Sign up a new user. `<nickname>` must not be in the database at the time of signup.

### Response

| Status Code | Response | Description                                  |
| ----------- | -------- | -------------------------------------------- |
| 200         | "0"      | Signup was successful.                       |
| 400         | "1"      | `<nickname>` already exists in the database. |
| 500         | `error`  | Internal Server Error                        |

---

```
GET /user/email/<email>
```

### Description

Get user information by `<email>`.

### Response

| Status Code | Response                                                                                                              | Description                                                                              |
| ----------- | --------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| 200         | <pre>[<br> {<br> "email": string,<br> "nickname: string, <br> "school": string<br> "elo_rating": int<br> }<br>]</pre> | Information retrieval was successful. The response is a JSON array with one JSON object. |
| 404         | "NO"                                                                                                                  | `<email>` is not in the database.                                                        |
| 500         | `error`                                                                                                               | Internal Server Error                                                                    |

---

```
DELETE /user/email/<email>
```

### Description

Delete user with email `<email>`.

### Response

| Status Code | Response | Description                             |
| ----------- | -------- | --------------------------------------- |
| 200         | "YES"    | Successfully removed from the database. |
| 404         | "NO"     | `<email>` is not in the database.       |
| 500         | `error`  | Internal Server Error                   |

---

```
GET /leaderboard
```

### Description

Get the leaderboard of top 20 users sorted by `elo_rating`'s.

### Response

| Status Code | Response                                                                                          | Description                                                                                    |
| ----------- | ------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| 200         | <pre>[<br> {<br> "nickname: string, <br> "school": string<br> "elo_rating": int<br> }*<br>]</pre> | Information retrieval was successful. The response is a JSON array with multiple JSON objects. |
| 500         | `error`                                                                                           | Internal Server Error                                                                          |

---

```
GET /leaderboard/school/<school>
```

### Description

Get the leaderboard of top 20 users who belong to `<school>` sorted by their `elo_rating`'s.

### Response

| Status Code | Response                                                                                          | Description                                                                                    |
| ----------- | ------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| 200         | <pre>[<br> {<br> "nickname: string, <br> "school": string<br> "elo_rating": int<br> }*<br>]</pre> | Information retrieval was successful. The response is a JSON array with multiple JSON objects. |
| 404         | "NO"                                                                                              | `<school>` does not exist in the database.                                                     |
| 500         | `error`                                                                                           | Internal Server Error                                                                          |
