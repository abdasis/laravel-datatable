<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Default Items Per Page
    |--------------------------------------------------------------------------
    |
    | This value determines the default number of items displayed per page
    | in the datatable when no specific value is provided.
    |
    */
    'default_per_page' => 10,

    /*
    |--------------------------------------------------------------------------
    | Available Per Page Options
    |--------------------------------------------------------------------------
    |
    | These are the options available to users for selecting how many items
    | they want to display per page.
    |
    */
    'per_page_options' => [10, 25, 50, 100],

    /*
    |--------------------------------------------------------------------------
    | Maximum Searchable Columns
    |--------------------------------------------------------------------------
    |
    | Maximum number of columns that can be searched at once.
    |
    */
    'max_searchable_columns' => 10,

    /*
    |--------------------------------------------------------------------------
    | Cache Duration
    |--------------------------------------------------------------------------
    |
    | Duration in minutes to cache table preferences and settings.
    | Set to 0 to disable caching.
    |
    */
    'cache_duration' => 60,

    /*
    |--------------------------------------------------------------------------
    | Enable Query Logging
    |--------------------------------------------------------------------------
    |
    | Enable logging of datatable queries for debugging purposes.
    | Only enable in development environment.
    |
    */
    'enable_query_logging' => env('DATATABLE_QUERY_LOGGING', false),
];
