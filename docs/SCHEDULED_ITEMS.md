# Scheduled Items

One of the key features of this plugin is the ability to schedule items (tasks, notes, etc.) for future dates. These items could be one-time transactions or recurring events. This document outlines the scheduled items characteristics and how they are managed within the plugin.

## Characteristics of Scheduled Items

### Item Details

The scheduled items has the same details as a regular transaction, including:

-   Name
-   Amount
-   Associated Accounts
-   Category
-   Subcategory
-   Date (recurrence date)
    And, as additionally:
-   Recurrence schedule (frequency and duration)

### Recurrence Schedule

Each scheduled item has a specific date and time when it is set to occur. This recurrence is defined with a start date, a frequency, and a duration.

#### Start Date

Indicates when the scheduled item first occurs.

#### Frequency

Defines how often the item recurs. The plugin supports various types of frequencies, including:

-   **Predefined Frequencies**: Daily, Weekly, Monthly, Yearly.
-   **Custom Frequencies**: Users can define custom intervals using the format `nX`, where `n` is a positive integer and `X` is a time unit (d for days, w for weeks, mo for months, y for years). These can be combined for more complex schedules. For example:
    -   `3d` means every 3 days.
    -   `2w` means every 2 weeks.
    -   `1mo` means every month.
    -   `1y` means every year.
    -   `1w3d` means every 1 week and 3 days.
    -   `2w1mo` means every 2 weeks and 1 month.
    -   `1mo6d` means every 1 month and 6 days.
    -   `1y2mo` means every 1 year and 2 months.
    -   `1y1mo3d` means every 1 year, 1 month, and 3 days.

#### Duration

Specifies how long the recurrence lasts. It can be set to:

-   A specific end date.
-   A number of occurrences (e.g., repeat 10 times).
-   Indefinitely (no end date, infinite).

The default duration is set to indefinitely.

### Schedule Flexibility

The plugin allows users to adjust the schedule of a recurring item. Users can modify the details of a specific occurrence without affecting the overall recurrence pattern. This is useful for skipping or rescheduling specific instances of a recurring item.
Per recurrence modifications include:

-   Modifying details of a specific occurrence (e.g., changing the amount or associated accounts for a transaction).
-   Deleting/skipping a specific occurrence.
-   Marking a specific occurrence as completed.
-   Rescheduling a specific occurrence to a different date regardless of the other recurrence dates (it could be moved to any date in the past or in the future, before or after any other recurrence).
