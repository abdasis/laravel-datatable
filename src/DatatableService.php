<?php

namespace Abdasis\LaravelDatatable;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;

class DatatableService
{
    /**
     * Process query and return paginated response for datatable
     *
     * @param Builder $query - Base query builder
     * @param string $resourceClass - Resource class for transforming data
     * @param array $searchableColumns - Columns that can be searched
     * @param int $perPage - Default items per page
     * @return array
     */
    public static function process(
        Builder $query,
        string $resourceClass,
        array $searchableColumns = [],
        int $perPage = 10
    ): array {
        // Apply search from request('search')
        if (request('search') && !empty($searchableColumns)) {
            $searchTerm = request('search');
            $query->where(function (Builder $q) use ($searchableColumns, $searchTerm) {
                foreach ($searchableColumns as $column) {
                    $q->orWhere($column, 'like', '%' . $searchTerm . '%');
                }
            });
        }

        // Apply sorting from request('sorting') with 'column' and 'order'
        if (request('sorting')) {
            $sorting = request('sorting');
            $column = $sorting['column'] ?? null;
            $order = $sorting['order'] ?? 'asc';

            if ($column) {
                $query->orderBy($column, $order);
            }
        }

        // Get per page from request or use default (support both perPage and per_page)
        $perPage = request('perPage', request('per_page', $perPage));

        // Paginate
        $paginator = $query->paginate($perPage);

        // Format response
        return self::paginate($paginator, $resourceClass);
    }

    /**
     * Format paginated data for datatable
     *
     * @param LengthAwarePaginator $paginator
     * @param string $resourceClass
     * @return array
     */
    public static function paginate(LengthAwarePaginator $paginator, string $resourceClass): array
    {
        return [
            'data' => $resourceClass::collection($paginator->items()),
            'meta' => [
                'total' => $paginator->total(),
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'from' => $paginator->firstItem(),
                'to' => $paginator->lastItem(),
                'path' => $paginator->path(),
                'links' => collect($paginator->linkCollection())->map(fn($link) => [
                    'url' => $link['url'],
                    'label' => $link['label'],
                    'active' => $link['active'],
                ])->toArray(),
            ],
            'links' => [
                'first' => $paginator->url(1),
                'last' => $paginator->url($paginator->lastPage()),
                'prev' => $paginator->previousPageUrl(),
                'next' => $paginator->nextPageUrl(),
            ],
        ];
    }
}
