effect module Watcher where { command = MyCmd, subscription = MySub } exposing (..)

import Task exposing (Task)
import Array exposing (Array)
import Date exposing (Date)
import Native.Watcher

type Watcher = Watcher
type alias Stats = { size: Int, mtime: Date }

type Event
  = Added String Stats
  | Changed String Stats
  | Unlinked String



type MyCmd msg
  = Watch (List String)
  | Unwatch (List String)


watch: List String -> Cmd msg
watch =
  command << Watch

unwatch: List String -> Cmd msg
unwatch =
  command << Unwatch

cmdMap : (a -> b) -> MyCmd a -> MyCmd b
cmdMap f cmd =
  case cmd of
    Watch paths -> Watch paths
    Unwatch paths -> Unwatch paths



type MySub msg
  = Listen (Event -> msg)

listen: (Event -> msg) -> Sub msg
listen =
  subscription << Listen

subMap : (a -> b) -> MySub a -> MySub b
subMap f sub =
  case sub of
    Listen tagger -> Listen (tagger >> f)



type alias State msg =
  { initialized: Bool
  , subs: List (MySub msg)
  }

init : Task Never (State msg)
init =
  Task.succeed { initialized = False, subs = [] }



handleCommand: Platform.Router msg Event -> MyCmd msg -> Task Never ()
handleCommand router cmd =
  case cmd of
    Watch paths -> Native.Watcher.watch paths
    Unwatch paths -> Native.Watcher.unwatch paths

onEffects
  : Platform.Router msg Event
  -> List (MyCmd msg)
  -> List (MySub msg)
  -> State msg
  -> Task Never (State msg)
onEffects router cmds subs state =
  (
    if state.initialized
    then Task.succeed ()
    else Native.Watcher.init { callback = Platform.sendToSelf router, added = Added, changed = Changed, unlinked = Unlinked }
  )
  |> Task.andThen (\_ -> Task.sequence <| List.map (handleCommand router) cmds)
  |> Task.map (always { initialized = True, subs = subs })


onSelfMsg : Platform.Router msg Event -> Event -> State msg -> Task Never (State msg)
onSelfMsg router selfMsg state =
  state.subs
  |> List.map (\sub -> case sub of
    Listen tagger -> Platform.sendToApp router (tagger selfMsg)
  )
  |> Task.sequence
  |> Task.map (always state)

read: { path: String, from: Int, to: Int } -> Task String String
read =
  Native.Watcher.read
