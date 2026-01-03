# Installation Guide

Complete step-by-step installation guide for Laravel Datatable package.

## Prerequisites

Before installing, ensure you have:

- PHP >= 8.2
- Laravel >= 11.0 or 12.0
- Node.js >= 18.0
- NPM or Yarn
- Inertia.js setup in your Laravel project
- React >= 18.0 or 19.0
- Tailwind CSS configured

## Step 1: Install Package via Composer

```bash
composer require abdasis/laravel-datatable
```

The package will be auto-discovered by Laravel.

## Step 2: Publish Assets

### Publish Frontend Components

```bash
php artisan vendor:publish --tag=datatable-assets
```

This will copy React/TypeScript components to:
```
resources/js/vendor/laravel-datatable/
├── components/
│   └── datatable/
├── lib/
├── types/
└── hooks/
```

### Publish Configuration (Optional)

```bash
php artisan vendor:publish --tag=datatable-config
```

This creates `config/datatable.php` for customization.

## Step 3: Install NPM Dependencies

### Required Dependencies

```bash
npm install @tanstack/react-table sonner moment zustand react-select laravel-react-i18n
```

### Icon Libraries

```bash
npm install @hugeicons/react @hugeicons/core-free-icons
```

Or if you prefer lucide-react (already installed with shadcn):
```bash
# Lucide icons are already available via shadcn
```

## Step 4: Install Shadcn UI Components

The datatable requires several shadcn/ui components:

```bash
npx shadcn@latest add context-menu popover drawer alert-dialog textarea command
```

If you haven't set up shadcn/ui yet:

```bash
npx shadcn@latest init
```

## Step 5: Configure Tailwind CSS

Add the vendor path to your Tailwind config to ensure styles are applied:

```js
// tailwind.config.js
export default {
    content: [
        './resources/**/*.{js,jsx,ts,tsx}',
        './resources/js/vendor/laravel-datatable/**/*.{js,jsx,ts,tsx}', // Add this line
    ],
    // ... rest of your config
}
```

## Step 6: Setup Path Aliases (If Not Already)

Ensure your `tsconfig.json` has the correct path mappings:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./resources/js/*"]
    }
  }
}
```

And in `vite.config.ts`:

```ts
import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.tsx'],
            refresh: true,
        }),
        react(),
    ],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './resources/js'),
        },
    },
});
```

## Step 7: Install Spatie Laravel Data (Recommended)

```bash
composer require spatie/laravel-data
```

Publish the config (optional):

```bash
php artisan vendor:publish --tag=data-config
```

For TypeScript type generation from Laravel Data:

```bash
php artisan data:typescript-transform
```

## Step 8: Setup Laravel React i18n (Optional)

If you want translations support:

```bash
# Publish language files
php artisan vendor:publish --tag=laravel-react-i18n

# Generate translations
php artisan react-i18n:generate
```

## Step 9: Verify Installation

Create a test page to verify everything works:

```php
// routes/web.php
use Abdasis\LaravelDatatable\DatatableService;
use App\Models\User;
use App\Data\UserData;

Route::get('/test-datatable', function () {
    $users = DatatableService::process(
        query: User::query(),
        resourceClass: UserData::class,
        searchableColumns: ['name', 'email'],
        perPage: 10
    );

    return inertia('TestDatatable', ['users' => $users]);
});
```

```tsx
// resources/js/pages/test-datatable.tsx
import Datatable from '@/vendor/laravel-datatable/components/datatable/table';
import { PaginatedData } from '@/vendor/laravel-datatable/types/datatable';

export default function TestDatatable({ users }: { users: PaginatedData<any> }) {
    const columns = [
        { header: 'Name', accessorKey: 'name' },
        { header: 'Email', accessorKey: 'email' },
    ];

    return <Datatable data={users} columns={columns} resourceKey="users" />;
}
```

## Step 10: Build Assets

```bash
npm run build
# or for development
npm run dev
```

## Troubleshooting

### Module Not Found Errors

If you get module not found errors, ensure:

1. All npm dependencies are installed
2. Path aliases are correctly configured
3. You've run `npm run dev` or `npm run build`

### TypeScript Errors

Run type checking:

```bash
npm run types
# or
npx tsc --noEmit
```

Fix any missing dependencies or type definitions.

### Styles Not Applying

1. Check Tailwind config includes vendor path
2. Rebuild assets: `npm run build`
3. Clear browser cache

### Missing UI Components

Install missing shadcn components:

```bash
npx shadcn@latest add [component-name]
```

Common components needed:
- button, input, label (basic forms)
- select, checkbox, tooltip (form controls)
- table, dialog, sheet (datatable UI)
- popover, dropdown-menu (interactions)

## Next Steps

- Read the [README.md](README.md) for usage examples
- Check [examples/](examples/) for complete implementations
- Review [CHANGELOG.md](CHANGELOG.md) for updates

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review closed issues on GitHub
3. Open a new issue with:
   - Laravel version
   - Package version
   - Error messages
   - Steps to reproduce
