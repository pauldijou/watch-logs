module File exposing (..)

import Date exposing (Date)
import Time exposing (Time)
import Watcher exposing (Stats)

type alias File =
  { path: String
  , name: String
  , enabled: Bool
  , lastModified: Time
  , readUntil: Int
  , color: String
  }

find: List File -> String -> Maybe File
find files path =
  List.head <| List.filter (\file -> file.path == path) files

update: String -> Int -> Date -> List File -> List File
update path readUntil lastModified files =
  List.map (\file ->
    if file.path == path
    then { file | readUntil = readUntil, lastModified = Date.toTime lastModified }
    else file
  ) files

without: String -> List File -> List File
without path files =
  List.filter (\file -> file.path /= path) files

nameOf: String -> String
nameOf path =
  String.split "/" path
  |> List.reverse
  |> List.head
  |> Maybe.withDefault ""

new: String -> Stats -> File
new path stats =
  { path = path
  , name = nameOf path
  , enabled = True
  , lastModified = Date.toTime stats.mtime
  , readUntil = 0
  , color = "#000000"
  }
