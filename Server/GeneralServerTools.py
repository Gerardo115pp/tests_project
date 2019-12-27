class Sha1:

    def __init__(self):
        self.h1 = 0x67452301
        self.h2 = 0xEFCDAB89
        self.h3 = 0x98BADCFE
        self.h4 = 0x10325476
        self.h5 = 0xC3D2E1F0

        self.bytes = ""


    def __setDefaultValues(self):
        self.h1 = 0x67452301
        self.h2 = 0xEFCDAB89
        self.h3 = 0x98BADCFE
        self.h4 = 0x10325476
        self.h5 = 0xC3D2E1F0

        self.bytes = ""

    def get_hash(self,data):
        if self.bytes:
            self.__setDefaultValues()
        return self.__Hash(data)

    def __Hash(self,data):

        for h in range(len(data)):

            self.bytes += "{0:08b}".format(ord(data[h]))

        bits = self.bytes + "1"

        pbits = bits

        while len(pbits) % 512 != 448:

            pbits += "0"

        pbits += "{0:064b}".format(len(bits)-1)

        for h in self.pedazo(pbits, 512):

            words = self.pedazo(h, 32)

            w = [0]*80

            for n in range(0, 16):

                w[n] = int(words[n], 2)

            for k in range(16, 80):

                w[k] = self.mover((w[k-3] ^ w[k-8] ^ w[k-14] ^ w[k-16]), 1)

            a = self.h1

            b = self.h2

            c = self.h3

            d = self.h4

            e = self.h5

            for k in range(0, 80):

                if 0 <= k <= 19:

                    f = (b & c) | ((~b) & d)

                    z = 0x5A827999

                elif 20 <= k <= 39:

                    f = b ^ c ^ d

                    z = 0x6ED9EBA1

                elif 40 <= k <= 59:

                    f = (b & c) | (b & d) | (c & d)

                    z = 0x8F1BBCDC

                elif 60 <= k <= 79:

                    f = b ^ c ^ d

                    z = 0xCA62C1D6

                temp = self.mover(a, 5) + f + e + z + w[k] & 0xffffffff

                e = d

                d = c

                c = self.mover(b, 30)

                b = a

                a = temp

            #input(f"e: {e}\nd: {d}\nc: {c}\nb: {b}\na: {a}\ntemp: {temp}")

            self.h1 = self.h1 + a & 0xffffffff

            self.h2 = self.h2 + b & 0xffffffff

            self.h3 = self.h3 + c & 0xffffffff

            self.h4 = self.h4 + d & 0xffffffff

            self.h5 = self.h5 + e & 0xffffffff

        return '%08x%08x%08x%08x%08x' % (self.h1, self.h2, self.h3, self.h4, self.h5)

    def pedazo(self, L, N):

        return [L[h:h+N] for h in range(0, len(L), N)]

    def mover(self, N, B):

        return ((N << B) | (N >> (32 - B))) & 0xffffffff