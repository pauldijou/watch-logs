module Payload exposing (..)

import Json.Decode exposing (..)
import Html exposing (Html, div, span, text, ul, li)
-- import Html.Attributes exposing (type_, value, placeholder, title, checked, step, style)
import Html.Events exposing (onClick)
import Styles exposing (class, classList)

type Payload
  = JsNull
  | JsString String
  | JsNumber Float
  | JsBoolean Bool
  | JsArray Bool (List Payload)
  | JsObject Bool (List (String, Payload))

decode: String -> Maybe Payload
decode payload =
  case decodeString decoder payload of
    Ok p -> Just p
    Err err -> Just <| JsString err

decoder: Decoder Payload
decoder =
  oneOf
    [ null JsNull
    , string |> map JsString
    , float |> map JsNumber
    , bool |> map JsBoolean
    , lazy (\_ -> decoder) |> list |> map (JsArray False)
    , lazy (\_ -> decoder) |> keyValuePairs |> map (JsObject False)
    ]

toggle: Payload -> Payload
toggle payload =
  case payload of
    JsArray o v -> JsArray (not o) v
    JsObject o v -> JsObject (not o) v
    p -> p

toggleChild: Payload -> Payload -> Payload
toggleChild child parent =
  if child == parent
  then toggle child
  else case parent of
    JsArray o v -> JsArray o <| List.map (toggleChild child) v
    JsObject o v -> JsObject o <| List.map (\(key, value) -> (key, (toggleChild child) value)) v
    p -> p

closeValues: (String, Payload) -> (String, Payload)
closeValues (key, value) =
  (key, close value)

close: Payload -> Payload
close payload =
  case payload of
    JsArray o v -> if o then JsArray False (List.map close v) else payload
    JsObject o v -> if o then JsObject False (List.map closeValues v) else payload
    p -> p

viewKey: Bool -> Bool -> String -> Html a
viewKey expandable opened key =
  span
    [ class [ Styles.PayloadKey ], classList [ (Styles.ClickMe, expandable), (Styles.Opened, opened) ] ]
    [ text <| key ++ ": " ]

viewKeyExtra: String -> String -> String -> Int -> Bool -> Html a
viewKeyExtra key type1 type2 size opened =
  viewKey True opened <| key ++ " " ++ type1 ++ " " ++ (toString size) ++ " " ++ type2 ++ (if size > 1 then "s" else "")


viewPrimitive: Styles.Classes -> String -> String -> Html a
viewPrimitive css key value =
  li
    []
    [ viewKey False False key
    , span [ class [ css ] ] [ text value ]
    ]

viewNull: String -> Html a
viewNull key =
  viewPrimitive Styles.PayloadNull key "null"

viewString: String -> String -> Html a
viewString key value =
  viewPrimitive Styles.PayloadString key <| "\"" ++ value ++ "\""

viewNumber: String -> Float -> Html a
viewNumber key num =
  viewPrimitive Styles.PayloadNumber key <| toString num

viewBoolean: String -> Bool -> Html a
viewBoolean key bool =
  viewPrimitive Styles.PayloadBoolean key <| toString bool

viewArray: (Payload -> a) -> a -> Bool -> List Payload -> String -> Html a
viewArray tagger msg opened items key =
  ul
    [ class [ Styles.PayloadArray ] ]
    (
      (li [ onClick msg ] [ viewKeyExtra key "[]" "item" (List.length items) opened ])
      :: (if opened then viewArrayItems tagger items else [])
    )

viewArrayItems: (Payload -> a) -> List Payload -> List (Html a)
viewArrayItems tagger items =
  List.indexedMap
    (\idx item -> view tagger item <| toString idx)
    items

viewObject: (Payload -> a) -> a -> Bool -> List (String, Payload) -> String -> Html a
viewObject tagger msg opened values key =
  ul
    [ class [ Styles.PayloadObject ] ]
    (
      (li [ onClick msg ] [ viewKeyExtra key "{}" "key" (List.length values) opened ])
      :: (if opened then viewObjectValues tagger values else [])
    )

viewObjectValues: (Payload -> a) -> List (String, Payload) -> List (Html a)
viewObjectValues tagger values =
  List.map
    (\(key, value) -> view tagger value key)
    values

view: (Payload -> a) -> Payload -> String -> Html a
view tagger payload key =
  case payload of
    JsNull -> viewNull key
    JsString str -> viewString key str
    JsNumber num -> viewNumber key num
    JsBoolean bool -> viewBoolean key bool
    JsArray opened items -> viewArray tagger (tagger payload) opened items key
    JsObject opened values -> viewObject tagger (tagger payload) opened values key
