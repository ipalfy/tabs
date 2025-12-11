## General rules
- Recency is generally most important: We don't care about "old" windows and tabs, so they should always be at the bottom
- We should show groups with recently opened tabs always on top. 
- Never re-sort tabs inside groups by recency
- App and popups (they are treated as tabs internally) should always be on top, but collapsed.
- We might igore windows alltogether and show only groups and tabs
- Chrome specific pages (see: chrome://chrome-urls/) also on top, collapsed.
- When fitering tabs by title/url (No need for fuzzy), their eclosing groups should be opened.
- Hide "Open Popup" button if windows is a popup (not in sidebar)
- Add more features to tab rows
  - Sleep: tab or (all tabs of the) group.
  - Not sure about save=copy/move? to bookmarks ...

## Open questions
- How to deal with pinned tabs per window? Collapsibe panel from all windows, similar to apps.
- How to deal with tabs not assigned to groups? Collapsibe panel from all windows
- 

## Ideas
- I still like the idea of "unifing" the notion of 
  - (windows/tabbgroups)/tabs/bookmarks ...
  - So tabs could have a status of 

- Using the siebar might never make sense. Maybe a popup?

- We might allow AI to rearrange Windows/groups/tabs
  - Not sure about possible criteria, could be local URLs, Url by topic, by domain, etc.

- Using bookmarks:
  - We should be able to save/load or better sync windows/groups/tabs in/from Bookmarks as saved tabs
  - Use hierarchy: Window/group/tab
  - We might use AI to re-arrange our (non-synced) bookmarks (Same as for rearranging groups tabs)
  - When restoring: Choose to restore into original window/group or a new window

- We could create some filterable(!) timeline-views:
  - Just the urls/tabs
  - Grouped by groups
  - Grouped by Google search?

### Potential AI Features
- Reorganize Windows/Tab Groups/Tabs based on some critera
- Reorganize Bookmarks based on some critera

## Potential Settings
- Refocus on Tab manager after selecting.
- 

## Potential top tab view

```
[Filter by text  | X] [Filter by date]                     | Open in Popup |
----------------------------------------------------------------------------
| Tabs | Timeline | Bookmarks                                   | Settings |
----------------------------------------------------------------------------

Tabs =======================================================================
----------------------------------------------------------------------------
| Groups | Apps - Pinned - Ungrouped                        | Collapse all |
----------------------------------------------------------------------------

Groups ----------------------------------------------- 12 groups / 4 Windows
--------------------
| Group Name 1                           1 tabs - Save | Sleep | Add Tab | X
| - Tab Title 1                                                    Sleep | X

--------------------
| Group Name 2                           3 tabs - Save | Sleep | Add Tab | X
| - Tab Title 2                                                    Sleep | X
| - Tab Title 3                                                     Wake | X
| - Tab Title 4                                                    Sleep | X

--------------------
| Group Name 3                           2 tabs - Save | Sleep | Add Tab | X
| - Tab Title 5                                                    Sleep | X
| - Tab Title 6                                                    Sleep | X


Apps/Popups | Pinned/Ungrouped Tabs -------- 2 Apps / 2 Pinned / 4 Ungrouped
--------------------
| Apps                                                      2 Apps / 1 Popup
| - App Title 1
| - App Title 2
| - Popup Title 2

--------------------
| Pinned Tabs                                                         2 Tabs
| - Tab Title 7                                                    Unpin | X
| - Tab Title 8                                                    Unpin | X

--------------------
| Ungrouped Tabs                                        4 tabs -   Sleep | X
| - Tab Title 9                                                    Sleep | X
| - Tab Title 10                                                   Sleep | X
| - Tab Title 11                                                   Sleep | X
| - Tab Title 12                                                   Sleep | X


Timeline ===================================================================
----------------------------------------------------------------------------
By Tab | By Group | By Search
----------------------------------------------------------------------------


Bookmarks ===================================================================
----------------------------------------------------------------------------
By Tab | By Group | By Search
----------------------------------------------------------------------------

```