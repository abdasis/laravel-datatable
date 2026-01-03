<?php

namespace Abdasis\LaravelDatatable;

use Illuminate\Support\ServiceProvider;

class DatatableServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        // Register the service
        $this->app->singleton(DatatableService::class, function ($app) {
            return new DatatableService();
        });
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        // Publish configuration
        if ($this->app->runningInConsole()) {
            $this->publishes([
                __DIR__.'/../config/datatable.php' => config_path('datatable.php'),
            ], 'datatable-config');

            // Publish frontend assets
            $this->publishes([
                __DIR__.'/../resources/js' => resource_path('js/vendor/laravel-datatable'),
            ], 'datatable-assets');
        }
    }
}
