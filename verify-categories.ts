import { db } from './db';
import { serviceCategories } from './db/schema';

async function verify() {
    console.log('Verifying seeded categories...\n');

    const categories = await db.select().from(serviceCategories);

    // Group by status
    const byStatus = categories.reduce(
        (acc, cat) => {
            const status = cat.status || 'active';
            if (!acc[status]) acc[status] = [];
            acc[status].push(cat);
            return acc;
        },
        {} as Record<string, typeof categories>
    );

    // Display summary
    console.log('📊 Category Summary:');
    console.log(`   Total: ${categories.length}`);
    console.log(`   ✓ Active:   ${byStatus.active?.length || 0}`);
    console.log(`   ⚪ Inactive: ${byStatus.inactive?.length || 0}`);
    console.log(`   🗑️  Deleted:  ${byStatus.deleted?.length || 0}`);

    // Display details
    console.log('\n📋 Active Categories:');
    byStatus.active?.slice(0, 5).forEach((cat) => {
        console.log(`   - ${cat.name}`);
    });
    if ((byStatus.active?.length || 0) > 5) {
        console.log(`   ... and ${(byStatus.active?.length || 0) - 5} more`);
    }

    console.log('\n⚪ Inactive Categories:');
    byStatus.inactive?.slice(0, 3).forEach((cat) => {
        console.log(`   - ${cat.name}`);
    });
    if ((byStatus.inactive?.length || 0) > 3) {
        console.log(`   ... and ${(byStatus.inactive?.length || 0) - 3} more`);
    }

    console.log('\n🗑️  Deleted Categories (In Trash):');
    byStatus.deleted?.forEach((cat) => {
        const deletedDate = cat.deletedAt
            ? new Date(cat.deletedAt).toLocaleDateString('vi-VN')
            : 'N/A';
        console.log(`   - ${cat.name} (deleted: ${deletedDate})`);
    });

    console.log('\n✅ Verification complete!');
}

verify().catch(console.error);
