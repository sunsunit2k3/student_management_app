import DataTable, { Column } from '../DataTable';

interface Order {
  id: number;
  user: {
    image: string;
    name: string;
    role: string;
  };
  projectName: string;
  team: {
    images: string[];
  };
  status: string;
  budget: string;
}

const tableData: Order[] = [
  {
    id: 1,
    user: { image: '/images/user/user-17.jpg', name: 'Lindsey Curtis', role: 'Web Designer' },
    projectName: 'Agency Website',
    team: { images: ['/images/user/user-22.jpg', '/images/user/user-23.jpg', '/images/user/user-24.jpg'] },
    budget: '3.9K',
    status: 'Active',
  },
  {
    id: 2,
    user: { image: '/images/user/user-18.jpg', name: 'Kaiya George', role: 'Project Manager' },
    projectName: 'Technology',
    team: { images: ['/images/user/user-25.jpg', '/images/user/user-26.jpg'] },
    budget: '24.9K',
    status: 'Pending',
  },
  {
    id: 3,
    user: { image: '/images/user/user-17.jpg', name: 'Zain Geidt', role: 'Content Writing' },
    projectName: 'Blog Writing',
    team: { images: ['/images/user/user-27.jpg'] },
    budget: '12.7K',
    status: 'Active',
  },
  {
    id: 4,
    user: { image: '/images/user/user-20.jpg', name: 'Abram Schleifer', role: 'Digital Marketer' },
    projectName: 'Social Media',
    team: { images: ['/images/user/user-28.jpg', '/images/user/user-29.jpg', '/images/user/user-30.jpg'] },
    budget: '2.8K',
    status: 'Cancel',
  },
  {
    id: 5,
    user: { image: '/images/user/user-21.jpg', name: 'Carla George', role: 'Front-end Developer' },
    projectName: 'Website',
    team: { images: ['/images/user/user-31.jpg', '/images/user/user-32.jpg', '/images/user/user-33.jpg'] },
    budget: '4.5K',
    status: 'Active',
  },
];

const columns: Column<Order>[] = [
  {
    key: 'user',
    header: 'User',
    sortable: true,
    sortKey: 'user.name',
    render: (order: Order) => (
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 overflow-hidden rounded-full">
          <img width={40} height={40} src={order.user.image} alt={order.user.name} />
        </div>
        <div>
          <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">{order.user.name}</span>
          <span className="block text-gray-500 text-theme-xs dark:text-gray-400">{order.user.role}</span>
        </div>
      </div>
    ),
  },
  { key: 'projectName', header: 'Project Name', sortable: true, render: (o: Order) => o.projectName },
  {
    key: 'team',
    header: 'Team',
    render: (o: Order) => (
      <div className="flex -space-x-2">
        {o.team.images.map((teamImage: string, index: number) => (
          <div key={index} className="w-6 h-6 overflow-hidden border-2 border-white rounded-full dark:border-gray-900">
            <img width={24} height={24} src={teamImage} alt={`Team member ${index + 1}`} className="w-full size-6" />
          </div>
        ))}
      </div>
    ),
  },
  {
    key: 'status',
    header: 'Status',
    sortable: true,
    render: (o: Order) => (
      <span className={`inline-block px-2 py-1 rounded text-theme-xs ${o.status === 'Active' ? 'bg-green-100 text-green-800' : o.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
        {o.status}
      </span>
    ),
  },
  { key: 'budget', header: 'Budget', sortable: true, render: (o: Order) => o.budget },
];

export default function BasicTableOne() {
  // In-memory fetcher: filters, search and paging
  async function fetcher({ page, size, query, filters }: any) {
    let items = tableData.slice();

    if (query) {
      const q = query.toLowerCase();
      items = items.filter((it) => it.user.name.toLowerCase().includes(q) || it.projectName.toLowerCase().includes(q));
    }

    if (filters?.status) {
      items = items.filter((it) => it.status === filters.status);
    }

    const total = items.length;
    const start = (page - 1) * size;
    const paged = items.slice(start, start + size);
    return { items: paged, total };
  }

  return (
    <DataTable columns={columns} fetchData={fetcher} initialPageSize={5} filters={[{ name: 'status', options: [{ label: 'Active', value: 'Active' }, { label: 'Pending', value: 'Pending' }, { label: 'Cancel', value: 'Cancel' }] }]} />
  );
}
