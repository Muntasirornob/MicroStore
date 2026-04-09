<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $count = DB::table('users')->count();

        if ($count === 0) {
            DB::table('users')->insert([
                [
                    'name' => 'John Doe',
                    'email' => 'john@example.com',
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'name' => 'Jane Smith',
                    'email' => 'jane@example.com',
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
            ]);

            echo "Seeded 2 users\n";
        } else {
            echo "Database already contains users, skipping seed\n";
        }
    }
}
