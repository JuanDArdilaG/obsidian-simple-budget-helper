# Scheduled Items V2

This document outlines the design and functionality of the Scheduled Items V2 feature in the Obsidian plugin. Scheduled Items V2 enhances the management of recurring transactions by introducing a more flexible and user-friendly approach to scheduling, and aims to resolve actual user pain points identified in the previous version.

### Improved Individual Recurrence Modifications

Building on the previous version, Scheduled Items V2 will offer more reliable control over individual occurrences of scheduled items. This includes:

-   The ability to easily modify the details of a specific occurrence without affecting the entire series.
-   Options to skip or delete specific occurrences.
-   Improved handling of exceptions and overrides for individual instances.

## Key Improvements

### Enhanced User Interface

The user interface for managing scheduled items will be revamped to provide a more intuitive experience. This includes:

-   A streamlined workflow for creating and editing scheduled items.
-   Improved visibility of upcoming scheduled items and their details.
-   Enhanced filtering and sorting options to quickly find specific items.
-   Intuitive recurrence pattern selection with visual aids.

## Technical Details

### Data Structure

The data structure for scheduled items will be updated to provide a better representation of recurrence patterns and individual modifications.
Currently, each scheduled item is represented with a single entry in the database with an array for the recurrence modifications, this modifications also include those recurrences that have been completed, and when the recurrence information is load by the plugin the recurrences and their information is calculated based on that information, but it can lead to complications when individual occurrences need to be modified.
In Scheduled Items V2, these modified recurrences will be represented in a separate table, linked to the original scheduled item. This allows for more granular control and easier management of exceptions. This includes the completed recurrences, which will be stored in the modifications table as well. The only information needed to be stored in this new table is the information that differs from the original scheduled item, for example if a recurrence was modified to have a different amount, only that information will be stored in the modifications table, while the rest of the information will be inherited from the main scheduled item.
In this way, the main scheduled item will contain the general recurrence pattern, while the modifications table will store any changes made to specific occurrences.
Also, the start date will never change to the next occurrence date, instead it will always represent the date of the first occurrence, this will help to avoid confusion when working with the scheduled items.

### Recurrence Patterns Form

The recurrence patterns form will be redesigned to provide a more user-friendly experience.
Currently, the form includes an input for the user to enter a custom recurrence pattern, but it can be confusing for users who are not familiar with the format.
In Scheduled Items V2, the form will include predefined options for common recurrence patterns (daily, weekly, monthly, yearly) as well as a more guided approach for creating custom patterns. This includes individual inputs for each time unit (hours, days, weeks, months, years) and visual aids to help users understand how their selections will affect the schedule.
