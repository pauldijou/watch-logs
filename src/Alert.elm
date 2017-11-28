module Alert exposing
  ( Model
  , Msg
  , init
  , withTimeout
  , withLimit
  , update
  , subscriptions
  , view
  , defaultView
  , create
  , add
  , remove
  , clear
  )

import Html exposing (Html, text, div, ul, li)
import Html.Attributes exposing (class)
import Html.Events exposing (onClick)
import Time exposing (Time)
import Task exposing (Task)

type Level = Success | Info | Warning | Error

type alias Alert lvl msg =
  { level: lvl
  , content: Html msg
  , at: Time
  }

type alias Model lvl msg =
  { timeout: Maybe Time
  , limit: Maybe Int
  , alerts: List (Alert lvl msg)
  , view: List (Alert lvl msg) -> Html msg
  }

type Msg
  = Tick Time
  | DefaultAction DefaultMsg

type DefaultMsg
  = Add (Alert Level DefaultMsg)
  | Remove (Alert Level DefaultMsg)

init: (List (Alert lvl msg) -> Html msg) -> Model lvl msg
init view =
  { timeout = Nothing
  , limit = Nothing
  , alerts = []
  , view = view
  }

withTimeout: Time -> Model lvl msg -> Model lvl msg
withTimeout timeout model =
  { model | timeout = Just timeout }

withLimit: Int -> Model lvl msg -> Model lvl msg
withLimit limit model =
  { model | limit = Just limit }

update: Msg -> Model lvl msg  -> (Model lvl msg , Cmd Msg)
update msg model =
  case msg of
    Tick time ->
      case model.timeout of
        Nothing -> model ! []
        Just timeout -> { model | alerts = List.filter (isTooOld time timeout) model.alerts } ! []

    DefaultAction subMsg -> case subMsg of
      Add alert -> (add alert model) ! []

      Remove alert -> (remove alert model) ! []

isTooOld: Time -> Time -> Alert lvl msg -> Bool
isTooOld current timeout alert =
  current - alert.at > timeout

subscriptions: Model lvl msg -> Sub Msg
subscriptions model =
  case model.timeout of
    Nothing -> Sub.none
    Just _ -> Time.every Time.second Tick

view: Model lvl msg -> Html msg
view model =
  model.view model.alerts

defaultView: { listClass: String, itemClass: String } -> List (Alert Level DefaultMsg) -> Html DefaultMsg
defaultView { listClass, itemClass } alerts =
  ul
    [ class listClass ]
    (List.map (defaultViewAlert itemClass) alerts)

defaultViewAlert: String -> Alert Level DefaultMsg -> Html DefaultMsg
defaultViewAlert itemClass alert =
  li
    [ class itemClass, onClick <| Remove alert ]
    [ alert.content ]

create: lvl -> Html msg -> Task Never (Alert lvl msg)
create lvl content =
  Time.now
  |> Task.map (\now ->
    { level = lvl, content = content, at = now }
  )

add: Alert lvl msg -> Model lvl msg -> Model lvl msg
add alert model =
  case model.limit of
    Nothing -> { model | alerts = alert :: model.alerts }
    Just limit -> { model | alerts = List.take limit <| alert :: model.alerts }

remove: Alert lvl msg -> Model lvl msg -> Model lvl msg
remove alert model =
  { model | alerts = List.filter (\a -> a /= alert) model.alerts }

clear: Model lvl msg -> Model lvl msg
clear model =
  { model | alerts = [] }
